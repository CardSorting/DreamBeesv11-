# Distill Pipeline: The Student (Prompt Composer)

The **Student** is the "Execution" phase. It consumes the "Aesthetic DNA" from the Teacher and applies it to specific concepts or subjects.

## Handler: `handleStudentComposeRequest`
- **File**: [functions/handlers/distillStudent.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/handlers/distillStudent.js)
- **Model**: Gemini 2.5 Flash

### Core Responsibilities
- **Pack Consumption**: Reads the authoritative rules of an Aesthetic Pack.
- **Internal Modes**: Silently selects a mode (Stabilized, Variant, Strain, or Edge) to control the "risk" and variance of the output.
- **Prompt Synthesis**: Generates a single, high-density prompt string optimized for image models (flux, sdxl, etc.).
- **Automated Hand-off**: Immediately triggers the generation pipeline.

## Automated Generation Trigger
The Student handler is integrated directly with the `Generation` handler. Once a prompt is composed:
1. It constructs a mock request including the `composedPrompt`, `modelId`, and `aspectRatio`.
2. It calls `Generation.handleCreateGenerationRequest`.
3. It handles errors gracefully (e.g., in local environments, it returns the composition result even if the queueing fails).

## Handler: `handleStudentBatchComposeRequest`
- **File**: [functions/handlers/distillStudentBatch.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/handlers/distillStudentBatch.js)
- **Model**: Gemini 2.5 Flash
- **System Prompt**: [distill-student-batch.md](file:///Users/bozoegg/Desktop/DreamBeesv11/distill-student-batch.md)

### Batch Responsibilities
- **High Volume**: Generates multiple prompts (default 10) in a single LLM call.
- **Exploration**: Varies `internal_mode` and `seed` per prompt within the same batch to show different facets of the aesthetic.
- **Optional Generation**: Can optionally trigger the image generation pipeline for every prompt in the batch in parallel.
- **Persistence**: Automatically saves the resulting batch JSON to the `functions/prompt_packs/` directory for historical reference and manual auditing.

## Precision Prompting
- **Locked Aesthetics**: Ensures motifs from the pack are present.
- **Negative Enforcement**: Incorporates forbidden elements into the `negative_prompt`.
- **Style Locking**: Returns `style_lock_notes`—mechanical reminders of the aesthetic's rigid boundaries.

## Usage
- **Single**: Triggered via `studentCompose`.
- **Batch**: Triggered via `studentBatchCompose`.

### Batch Parameters
- `packId` or `pack`: Aesthetic Pack data.
- `batchCount`: Number of prompts to generate (default 10).
- `triggerGeneration`: Boolean. If true, starts image generation for all prompts.
- `userRequest`: (Optional) Conceptual direction for the batch.
- `modelId`, `aspectRatio`, `steps`: Standard generation overrides.
### Batch Synthesis Workflow
The batch synth strategy allows for a fully automated elite showcase flow:
1. **Compose**: Call `studentBatchCompose` to generate 10+ prompts.
2. **Audit**: Locate the saved JSON in `functions/prompt_packs/`.
3. **Showcase**: Run the showcase script with the saved JSON:
   ```bash
   node functions/scripts/generate_kawaii_cosplay_showcase.js --pack=functions/prompt_packs/filename.json
   ```
