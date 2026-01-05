# 01. Mission & Architecture Overview

## The DreamBees Data Mission

The primary objective of the DreamBees ML Data Pipeline is to **transform subjective user interactions into objective, machine-learnable signals** with zero manual intervention.

In traditional ML workflows, data collection is followed by a laborious "Cleaning & Tagging" phase. Our mission is to eliminate that phase entirely. By enforcing strict constraints at the *point of ingestion*, we ensure that every byte of data entering the system is already:
1.  **Clean**: Validated schema.
2.  **Split**: Pre-assigned to Train/Val sets.
3.  **Enriched**: Ready for automated scoring.

## System Architecture

The system is composed of three distinct layers:

### 1. The Interaction Layer (Frontend)
*   **Component**: `ModelContext.jsx` & `Generator.jsx`
*   **Responsibility**:
    *   Captures user clicks (Like/Dislike).
    *   **Buffers** high-velocity interactions to prevent database overload.
    *   Provides "Optimistic UI" updates (instant feedback to user).
    *   **Atomic Batching**: Flushes aggregated state every 3 seconds.

### 2. The Ingestion Layer (Firestore)
*   **Component**: Firestore `training_feedback` collection.
*   **Responsibility**:
    *   Acts as the immutable log of truth.
    *   **Enforces Idempotency**: Document IDs are deterministic (`feedback_{JobId}`).
    *   **Storage**: Stores the "Raw Signal" + "Asset Pointers".
    *   **Scaling**: Configured with Index Exemptions to handle >10,000 writes/sec.

### 3. The Enrichment Layer (Async Agents)
*   **Component**: Stateless LMM (Large Multimodal Model) Workers.
*   **Responsibility**:
    *   Watch for new logs.
    *   Execute the embedded `agent_task`.
    *   Write back high-fidelity metadata (Captions, Aesthetic Scores).
    *   This layer is **decoupled** from the user-facing app.

## Why This Architecture?

| Traditional Approach | DreamBees Architecture |
| :--- | :--- |
| **Write-Heavy**: 1 click = 1 DB write. | **Buffered**: 50 clicks = 1 Batch write. |
| **Post-Hoc Splitting**: Split data before training. Risk of leakage. | **Ingestion Splitting**: Data is born as 'Train' or 'Test'. |
| **Manual Tagging**: Humans rate images. | **Agent Tagging**: LMMs rate images 24/7. |
| **Ambiguous Pairs**: Hard to find "Winner/Loser". | **Signature Pairing**: Exact intent matches are automatic. |

This architecture shifts the complexity "Left" — tackling MLOps challenges at the moment of creation rather than weeks later during training.
