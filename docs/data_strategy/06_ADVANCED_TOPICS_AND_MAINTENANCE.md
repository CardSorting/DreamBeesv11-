# 06. Advanced Topics & Maintenance

This final section addresses the long-term operational concerns of the DreamBees pipeline: **Cost**, **Governance**, **Safety**, and **Evolution**.

## 1. Cost Analysis & Control

High-velocity data pipelines can become expensive if not monitored.

### Estimated Costs (at 10,000 Daily Active Users)
*Assumptions: 10k DAU, 50 gens/user, 10% rating rate = 50,000 ratings/day.*

| Component | Usage | Unit Cost (Approx) | Daily Cost |
| :--- | :--- | :--- | :--- |
| **Firestore Writes** | 50k (1k batches) | $0.18 / 100k | < $0.10 |
| **Firestore Storage** | 50k docs (1KB ea) | $0.18 / GB | Negligible |
| **LMM Enrichment** | 50k images | $5 / 1k images | **$250.00** |
| **Bandwidth** | 50GB | $0.12 / GB | $6.00 |

### Cost Control Strategies
1.  **Sampling**: You do not need to enrich *every* image.
    *   **Logic**: Only enrichment high-rated images (`rating == 1`) or a random 10% sample.
    *   ** Implementation**: Update the Worker Agent to check `if random() < 0.1: process()`.
2.  **Tiered Models**: Use cheaper models (e.g., Haiku/Flash) for basic captioning and expensive models (GPT-4o) only for aesthetic scoring on "Winner" images.

---

## 2. Safety & Content Moderation

Training on unfiltered user feedback runs the risk of aligning the model towards NSFW or harmful content if users "Like" such content.

### The "Safety Shield" Pattern
The Worker Agent should act as a Safety Gate.

1.  **Step**: During LMM enrichment, prompt the model to detect unsafe content.
2.  **Instruction**: *"Flag if image contains: Nudity, Violence, Hate Symbols."*
3.  **Action**: If flagged:
    *   Set `enrichment.safety_label = 'unsafe'`.
    *   **Exclude** from all DPO training views (`WHERE safety_label != 'unsafe'`).
    *   Optionally: Trigger a "Ban User" workflow.

---

## 3. Data Governance & Privacy (GDPR/CCPA)

### User Deletion
When a user requests deletion, we must scrub their signals.
*   **Challenge**: Logs are immutable `training_feedback` documents.
*   **Solution**:
    1.  Query `training_feedback` where `asset_pointers.user_id == TargetUserID`.
    2.  **Soft Delete**: Update `pvi_deleted = true`. Do not physically delete if you want to preserve aggregate stats, but exclude from training.
    3.  **Hard Delete**: Physical delete.
*   **Note**: If an image has already been baked into a trained model weights, it generally cannot be "unlearned" without retraining.

---

## 4. Schema Evolution

The `agent_task` structure allows us to evolve the pipeline without redeploying the frontend app.

### Versioning Strategy
To change the LMM instructions (e.g., "Rate 1-100" instead of "1-10"):

1.  **Frontend**: Update `ModelContext.jsx` to inject `agent_task.version = 2`.
2.  **Worker**: Update the Python script to handle versions:
    ```python
    if task['version'] == 2:
        return score / 100  # Normalize to 0-1
    else:
        return score / 10   # Legacy
    ```
3.  **Data Lake**: Store the raw version number in `enrichment.processor_version` so data scientists know how to interpret the score.

---

## 5. Disaster Recovery

### The "Re-Split" Hazard
If we ever lose the database and restore from a backup, the **Generation/Job IDs** are preserved.
*   Since our **Data Split** (`Train`/`Val`) is calculated from `Hash(JobId)`, the restored data will **automatically** respect the original train/test split.
*   **Benefit**: This proves the robustness of "Deterministic Splitting" over random splitting. You can burn down the DB, re-ingest the logs, and your ML validation metrics remain comparable.

---

## 6. Closing the Loop (Deployment)

Once a DPO model is trained:
1.  **Upload**: Push `lora_weights.safetensors` to the Storage Bucket.
2.  **Register**: Add a new entry to the `models` collection in Firestore.
3.  **Config**: Set `showcase_images` using high-scoring examples from the `training_feedback` set.
4.  **Live**: The React App (Frontend) automatically picks up the new model via the `useModel` hook.

**The Cycle is Complete.**
User Action -> Ingestion -> Agent -> Training -> New Model -> User Action.
