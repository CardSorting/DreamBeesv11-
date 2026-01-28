# Distill Pipeline: The Teacher (Distillation Engine)

The **Teacher** is responsible for the "Observation and Formalization" phase. Its goal is to extract a reusable "Aesthetic DNA" from a set of images.

## Handler: `handleDistillRequest`
- **File**: [functions/handlers/distill.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/handlers/distill.js)
- **Model**: Gemini 2.5 Flash

### Core Responsibilities
- **Aesthetic Ranking**: Identifies which images in a set most strongly represent a shared style.
- **Rule Extraction**: Formalizes visual patterns into declarative rules (not creative prose).
- **JSON Output**: Produces a strictly formatted "Aesthetic Pack".

## The Aesthetic Pack Schema
The Teacher outputs a rich JSON structure containing:
- `aesthetic_name`: A concise label for the style.
- `motif_inventory`: List of recurring objects/patterns.
- `compositional_rules`: Rigid layout constraints.
- `color_behavior`: Explicit palettes and saturation rules.
- `forbidden_elements`: Items that cause the style to collapse.
- `degradation_triggers`: Conditions where the aesthetic "drifts" into generic styles.

## Local Storage
Generated packs are saved under `functions/packs/` as `.json` files. These files are then used by the Student to generate prompts.

## Example Command
The distillation can be triggered via the main API with the `distill` action, providing an array of `imageUrls`.
