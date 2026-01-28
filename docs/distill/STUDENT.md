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

## Precision Prompting
Unlike generic prompt generators, the Student:
- **Locked Aesthetics**: Ensures motifs from the pack are present.
- **Negative Enforcement**: Incorporates forbidden elements into the `negative_prompt`.
- **Style Locking**: Returns `style_lock_notes`—mechanical reminders of the aesthetic's rigid boundaries.

## Usage
Triggered via the `studentCompose` action.
Required parameters: `packId` (or `pack` object), `userRequest`, and `modelId`.
