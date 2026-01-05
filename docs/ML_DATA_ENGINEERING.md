# DreamBees ML Data Engineering & MLOps Strategy

## 1. Executive Summary

This document serves as the **Standard Operating Procedure (SOP)** for the DreamBees aesthetic training pipeline. It bridges the gap between the frontend User Ranking System and the backend Machine Learning workflows (RLHF/DPO).

**Goal**: To provide an autonomous, high-velocity, and "Ready-to-Process" dataset that requires **Zero Manual Curation** before training.

---

## 2. Infrastructure Setup Guide

### A. Prerequisites
1.  **Firebase Project**: Ensure you have access to `dreambees-app-gen-v1`.
2.  **Google Cloud SDK**: Required if managing BigQuery exports.
3.  **Python 3.10+**: For the "Worker Agent" or data extraction scripts.

### B. Database Configuration
We rely on specific Firestore configurations to handle high concurrency.

1.  **Index Exemptions**:
    *   **Crucial**: You MUST exempt `timestamp` and `rating` from automatic indexing in the `training_feedback` collection.
    *   **Why**: Firestore limits writes to ~500/sec for strictly monotonic indexed fields (like timestamps). Exempting them allows us to scale to **10,000+ writes/sec**.
    *   **Deploy**:
        ```bash
        firebase deploy --only firestore:indexes
        ```
    *   *(See `firestore.indexes.json` for the exact config)*.

### C. The "Worker Agent" (LMM Processor)
The system is designed for a stateless "Worker Agent" to autonomously enrich data. This agent does **not** exist in the React app; it is an external process (e.g., a Cloud Run service or a Python script).

**Setup Instructions**:
1.  Create a service account with `Firebase Viewer` + `BigQuery Data Editor` roles.
2.  Run a script that listens to `training_feedback` where `enrichment.status == 'pending'`.
3.  On receipt, the script looks at `agent_task.instruction_template`.
4.  It calls GPT-4o/Gemini with the image and prompt.
5.  It writes the result back to `enrichment` and sets `status = 'completed'`.

---

## 3. MLOps Strategy & Philosophy

We implement strict MLOps practices at the *ingestion point* to ensure training reproducibility and data hygiene.

### A. The "Idempotency" Guarantee
*   **Problem**: Users often double-click, change their minds (Like -> Dislike -> Like), or network retries cause duplicate logs.
*   **Strategy**: We generate a deterministic Document ID: `feedback_{JobId}`.
*   **Result**: Even if a user clicks "Like" 100 times, we only ever have **one** ground-truth record for that image. The last click wins. This eliminates the need for "de-duplication" logic in your training pipeline.

### B. Deterministic Data Splitting
*   **Problem**: Random splitting (e.g., `sklearn.train_test_split`) during training is dangerous. If you re-fetch data, an image might move from Train to Test, causing data leakage.
*   **Strategy**: We calculate the split **at creation time**:
    ```javascript
    Hash(JobId) % 100 < 90 ? 'train' : 'validation'
    ```
*   **Result**: An image is mathematically permanently assigned to a split. You can re-download the dataset 6 months later, and the Validation set will be identical.

### C. DPO-Ready "Configuration Signatures"
Direct Preference Optimization (DPO) requires pairs of `(Winner, Loser)` generated from the *exact same intent*.

*   **The Signature**: We compute a strict hash of the generation parameters:
    > `Hash(ModelID + Prompt + NegativePrompt + CFG + Steps + AspectRatio)`
*   **Why exclude Seed?**: We *want* to compare Image A (Seed 1) vs Image B (Seed 2) for the exact same prompt.
*   **The Process**:
    1.  User generates Image A. Dislikes it. (Stored with `Sig_123`).
    2.  User generates Image B (same settings, new seed). Likes it. (Stored with `Sig_123`).
    3.  **Training Query**: "Find all records with `Sig_123`. If one is Like and one is Dislike, BINGO. You have a training pair."

---

## 4. Full Data Lifecycle Walkthrough

### Step 1: User Action (The "Click")
*   User clicks "Like" on an image.
*   **Frontend**: Does *not* write immediately. It adds the rating to a local memory buffer (`ratingQueue`).
*   **UI**: Instantly updates to show the "Like" state (Optimistic UI).

### Step 2: Ingestion (The "Batch")
*   Every 3 seconds, the buffer flushes.
*   **Batch Write**:
    1.  Updates `generation_queue` (User History).
    2.  Updates `images` (Gallery).
    3.  Upserts `training_feedback` (The ML Log).
        *   Calculates `dataset_split`.
        *   Calculates `configuration_signature`.
        *   Injects `agent_task`.

### Step 3: Enrichment (The "Agent")
*   (Asynchronous) The Worker Agent spots the new record.
*   It sees `agent_task`: _"Rate aesthetic quality from 1-10"_.
*   It processes the image and writes `enrichment.aesthetic_score = 8.5`.

### Step 4: Training (The "Scientist")
*   Scientist queries Firestore/BigQuery:
    ```sql
    SELECT * FROM training_feedback
    WHERE dataset_split = 'train'
      AND enrichment.aesthetic_score > 7.0
    ```
*   Result: A clean, high-quality, pre-tagged dataset ready for LoRA/Fine-tuning.

---

## 5. Schema Reference

### `training_feedback/{feedbackId}`

| Field | Description |
| :--- | :--- |
| **`_id`** | `feedback_{JobId}` (Deterministic) |
| **`dataset_split`** | `'train'` or `'validation'` |
| **`configuration_signature`** | Hash of generation params. Keys DPO groups. |
| **`rating`** | `1` (Like), `-1` (Dislike) |
| **`agent_task`** | Object. `instruction_template`, `input`. Stateless instructions for LMM. |
| **`enrichment`** | Object. `status`, `aesthetic_score`, `generated_caption`. |
| **`meta`** | Object. `cfg`, `steps`, `width`, `height`, `modelId`. |
| **`asset_pointers`** | Object. Links to `image_url` and user IDs. |
