# Distill Pipeline: Overview

The Distill Pipeline is a two-stage generative system designed to capture, formalize, and re-apply visual aesthetics using AI. It separates the "observation" of style from the "creative act" of generation.

## Modes of Operation

### 1. Simple Distillation
A single pass analyzing a small batch of images (3-10). Ideal for quick captures of distinct styles.

### 2. Sequenced Distillation (Iterative Refinement)
A multi-pass process that scales to hundreds of images.
- **Logic**: Images are processed in chunks. An initial pack is created, then refined by subsequent chunks.
- **Resiliency**: The system automatically skips chunks that trigger safety filters, ensuring the distillation process continues.
- **Fidelity**: This mode produces significantly higher confidence scores and more robust style locking by aggregating evidence over a larger sample size.

2.  **Stage 2a: The Student (Single Prompt Composition)**
    - **Handler**: `handleStudentComposeRequest` ([distillStudent.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/handlers/distillStudent.js))
    - **Input**: An Aesthetic Pack + (optional) User Request.
    - **Logic**: Translates abstract pack rules into a single high-fidelity image prompt.
    - **Output**: A single prompt/negative prompt pair.

3.  **Stage 2b: Batch Synthesis (High-Volume Generation)**
    - **Handler**: `handleStudentBatchComposeRequest` ([distillStudentBatch.js](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/handlers/distillStudentBatch.js))
    - **Logic**: Generates a batch (default 10) of diverse image prompts from a single pack.
    - **Diversity**: Varies internal modes and seeds across the batch to explore the full range of the aesthetic.

4.  **Stage 3: Automated Trigger (Image Generation)**
    - **Logic**: The Student (Single or Batch) automatically calls the `Generation` handler.
    - **Output**: Enqueued image generation tasks in the system queue.

## Data Flow

```mermaid
graph TD
    Images[Reference Images] --> Teacher[Teacher: distill.js]
    Teacher --> Pack[Aesthetic Pack JSON]
    Pack --> StudentA[Student Single: distillStudent.js]
    Pack --> StudentB[Student Batch: distillStudentBatch.js]
    UserReq[User Concept] --> StudentA
    UserReq --> StudentB
    StudentA --> Prompt[High-Fidelity Prompt]
    StudentB --> Prompts[Batch of Prompts]
    Prompt --> Gen[Generation Trigger]
    Prompts --> Gen
    Gen --> Queue[Image Queue]
```

## Key Files
- [distill.md](file:///Users/bozoegg/Desktop/DreamBeesv11/distill.md): System prompt for the Teacher.
- [distill-student.md](file:///Users/bozoegg/Desktop/DreamBeesv11/distill-student.md): System prompt for the Student (Single).
- [distill-student-batch.md](file:///Users/bozoegg/Desktop/DreamBeesv11/distill-student-batch.md): System prompt for the Student (Batch).
- [functions/packs/](file:///Users/bozoegg/Desktop/DreamBeesv11/functions/packs/): Local storage for generated packs.
