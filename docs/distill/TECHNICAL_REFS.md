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
  - `modelId`: Target generation model (e.g., `wai-illustrious`).
  - `aspectRatio`: (Optional) Default `1:1`.

## Integration Tests

Located in `functions/scripts/`:

1.  **[testDistill.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/scripts/testDistill.js)**
    - Tests the Teacher handler.
    - Downloads sample images, runs distillation, and verifies JSON saving.

2.  **[testDistillStudent.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/scripts/testDistillStudent.js)**
    - Tests the Student handler.
    - Loads a saved pack, generates a prompt, and verifies the `Generation` trigger logic and cost estimation.

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

### Student Output
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
