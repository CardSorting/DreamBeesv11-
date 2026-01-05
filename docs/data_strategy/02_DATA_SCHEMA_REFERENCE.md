# 02. Data Schema Reference

This document provides a comprehensive reference for the `training_feedback` collection schema. This schema is designed to be self-describing and machine-readable.

## Document Structure

Each document represents a single **Feedback Event** on a generated image.

### Identity & Control
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | String | **Critical**. Format: `feedback_{JobId}`. This deterministic ID ensures that multiple ratings of the same image overwrite each other, guaranteeing **Idempotency**. |
| `dataset_split` | String | `'train'` (90%) or `'validation'` (10%). Calculated deterministically: `Hash(JobId) % 100`. |
| `timestamp` | Timestamp | Server-side timestamp. **Note**: Exempt from indexing to allow high throughput. |

### The Core Signal
| Field | Type | Description |
| :--- | :--- | :--- |
| `rating` | Integer | `1` (Like) vs `-1` (Dislike). The primary learning target. |
| `weight` | Float | Default `1.0`. Can be adjusted later for weighted training. |
| `configuration_signature` | String | **Critical for DPO**. A SHA-256 hash of `Model + Prompt + NegPrompt + CFG + Steps + AspectRatio`. Used to group "Winner/Loser" pairs. |

### Metadata (`meta`)
Immutable parameters used for generation. Snapshot for reproducibility.
```json
"meta": {
  "modelId": "sdxl-base",
  "prompt_cleaned": "A cyberpunk city...",
  "negative_prompt": "blurry, low quality",
  "cfg": 7.0,
  "steps": 30,
  "seed": 123456789,
  "width": 1024,
  "height": 1024,
  "aspect_ratio_label": "1:1"
}
```

### Agent Instructions (`agent_task`)
A self-contained instruction block for LMM Agents.
```json
"agent_task": {
  "task_id": "analyze_feedback_08c...",
  "type": "aesthetic_scoring_and_captioning",
  "priority": "high",
  "input": {
      "image_url": "https://cdn...",
      "user_prompt": "A cyberpunk city...",
      "model_context": "Model: sdxl, CFG: 7"
  },
  "instruction_template": "Analyze the attached image. 1) Rate aesthetic quality (1-10)..."
}
```
*   **Design Note**: The `input` field is normalized so the agent doesn't need to know the schema of `meta` or `asset_pointers`.

### Enrichment (`enrichment`)
The "Write Target" for LMM Agents. Initialized to empty/pending.
```json
"enrichment": {
  "status": "pending",        // 'pending' | 'completed' | 'failed'
  "aesthetic_score": null,    // Float (0-10)
  "clip_score": null,         // Float (0-1)
  "generated_caption": null,  // String
  "tags": []                  // Array<String>
}
```
*   **Usage**: Researchers filter by `enrichment.aesthetic_score` to find high-quality subsets.

### Asset Pointers (`asset_pointers`)
Links to external resources.
```json
"asset_pointers": {
  "image_url": "https://...",      // Public/CDN URL
  "gen_doc_path": "generation_queue/xyz",
  "user_id": "user_123"
}
```
