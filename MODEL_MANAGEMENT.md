# Dynamic Model Management System

This document outlines the strategy for managing image generation models dynamically using **Firebase Firestore** and **Modal**. This approach replaces hardcoded arrays with a scalable, database-driven solution.

## Architecture Overview

The system consists of three main parts:
1.  **Backend (Modal)**: Hosts the actual model weights and provides the inference API.
2.  **Database (Firestore)**: Stores metadata about each model (name, description, tags, preview images).
3.  **Frontend (React)**: Fetches metadata from Firestore to populate the UI automatically.

---

## 1. Firestore Schema: `models` Collection

Each model is stored as a document in the `models` collection.

### Document Fields
- `id` (string): Unique identifier (e.g., `sdxl-cat-carrier`). This **MUST** match the `model` parameter used in the Modal inference call.
- `name` (string): User-friendly display name (e.g., `SDXL Cat Carrier`).
- `description` (string): Short blurb about the model's style or strengths.
- `image` (string): URL to a preview image (stored in B2, Firebase Storage, or local assets).
- `tags` (array of strings): Categories used for filtering in the UI (e.g., `['SDXL', 'Photorealistic']`).
- `order` (number): Used to determine the display order in the UI (ascending).

### Example Document
```json
{
  "id": "hassaku-illustrious",
  "name": "Hassaku Illustrious",
  "description": "High-quality anime style model with vibrant colors.",
  "image": "/models/hassaku_illustrious_preview.png",
  "tags": ["Anime", "Illustrious", "Vibrant"],
  "order": 2
}
```

---

## 2. Directory Management (Backend)

When managing multiple models in your backend environment (e.g., Modal or a custom server), follow this directory structure to stay organized:

```text
/models
├── sdxl-cat-carrier/
│   ├── model_index.json
│   ├── unet/
│   ├── vae/
│   └── (weights...)
├── hassaku-illustrious/
│   └── hassaku_v3.safetensors
└── scripts/
    └── upload_to_volume.py
```

### Deployment Workflow
1.  **Stage Files**: Place your model weights in a sub-directory named after your unique ID.
2.  **Upload to Volume**: Sync your local directory to the remote volume (e.g., `modal volume put sdxl-model-vol local_path/ remote_path/`).
3.  **Indexing**: Once uploaded, create the corresponding Firestore entry (see Section 3).

---

---

## 3. Backend Integration (Modal)

The Modal backend uses the `id` from Firestore to select the appropriate pipeline. 

Inside `functions/index.js`, the request is sent to Modal with the `modelId`:
```javascript
const params = new URLSearchParams({
    prompt: prompt,
    model: modelId, // This comes from selectedModel.id in the frontend
    // ...other params
});
```

---

## 4. Frontend Integration

The `ModelContext.jsx` manages the state and fetching logic:

### Fetching Logic
```javascript
const modelsRef = collection(db, 'models');
const q = query(modelsRef, orderBy('order', 'asc'));
const querySnapshot = await getDocs(q);
```

### Usage in Components
All components (Generator, Models, etc.) consume the list via `useModel()`:
```javascript
const { availableModels, selectedModel, loading } = useModel();
```

---

## Best Practices
- **ID Consistency**: Always ensure the Firestore Document ID matches your Modal model key.
- **Preview Optimization**: Host preview images on a CDN or cloud storage (like Backblaze B2) to ensure fast load times for the "Select Engine" page.
- **Tagging**: Use consistent tag names (e.g., "Photorealistic" vs "Photo-realistic") to ensure the UI category filter works correctly.
