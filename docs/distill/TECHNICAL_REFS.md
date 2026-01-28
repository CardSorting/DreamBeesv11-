# Distill Pipeline: Technical Reference

Detailed technical specifications for the Distill Pipeline.

## API Endpoints (`api.js`)

### `distill`
Engages the Teacher to analyze images.
- **Data**: `action: "distill"`, `imageUrls: string[]`
- **Permissions**: Requires authenticated user.

### `studentCompose`
Engages the Student to generate a prompt and trigger an image.
- **Data**:
  - `packId`: Filename in `functions/packs/`.
  - `userRequest`: String describing the subject.
  - `modelId`: Target generation model.
  - `aspectRatio`: (Optional) Default `1:1`.

### `studentBatchCompose`
Engages the Batch Student to synthesize multiple diverse prompts.
- **Data**:
  - `packId`: Filename in `functions/packs/`.
  - `batchCount`: Number of prompts (default 10).
  - `triggerGeneration`: If true, triggers immediate image generation for all prompts.
  - `userRequest`: Semantic direction for the batch.

## Integration Tests

Located in `functions/scripts/`:

1.  **[testDistill.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/scripts/testDistill.js)**
    - Tests the Teacher handler.
    - Downloads sample images, runs distillation, and verifies JSON saving.

2.  **[testDistillStudent.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/scripts/testDistillStudent.js)**
    - Tests the Student handler.
    - Loads a saved pack, generates a prompt, and verifies the `Generation` trigger logic and cost estimation.

3.  **[test_student_batch.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/scripts/test_student_batch.js)**
    - Tests the Batch Student handler.
    - Generates 3 prompts from a sample pack and verifies internal mode diversity and JSON structure.
4.  **[generate_kawaii_cosplay_showcase.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/scripts/generate_kawaii_cosplay_showcase.js)**
    - Automates showcase image generation for the Kawaii Cosplay aesthetic.
    - **Automation**: Supports the `--pack` flag to load prompts from saved batch JSON files.
    - **Usage**: `node functions/scripts/generate_kawaii_cosplay_showcase.js --pack=functions/prompt_packs/YOUR_BATCH_FILE.json`

## Troubleshooting

### "User not found" (Local Test)
- This occurs because the `Generation` handler attempts to check Zap balances.
- **Fix**: Use an anonymous UID in the test mock (e.g., `anonymous-galmix-test`) to bypass balance checks for specific models.

### "Failed to determine service account"
- This is expected when running `testDistillStudent.js` locally, as the script doesn't have permissions to sign Cloud Task requests.
- **Result**: The Student will return `status: "composition_only"`. This confirms the composition logic is perfect even if the final queueing is skipped.

## Prompt Schemas
### Aesthetic Pack (Teacher Output)
```json
{
  "aesthetic_name": "...",
  "motif_inventory": ["..."],
  "compositional_rules": ["..."],
  "color_behavior": {...},
  "forbidden_elements": ["..."],
  "confidence_score_per_rule": {...}
}
```

### Student Output (Single)
```json
{
  "success": true,
  "composed": {
    "prompt": "...",
    "negative_prompt": "...",
    "style_lock_notes": ["..."]
  },
  "generation": { ... }
}
```

### Student Output (Batch)
```json
{
  "success": true,
  "pack_name": "...",
  "batch": [
    {
      "prompt": "...",
      "negative_prompt": "...",
      "style_lock_notes": ["..."],
      "internal_mode": "..."
    }
  ]
}
```

### Batch Persistence
Batches are saved to `functions/prompt_packs/{sanitized_name}_batch_{timestamp}.json`.
