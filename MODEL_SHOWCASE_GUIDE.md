# Model Showcase Images Guide

The **Model Detail** page (`/model/:id`) uses a dedicated Firestore collection called `model_showcase_images` to display high-quality, curated examples for each model. This separates the "official" model showcase from the user-generated content feed.

## Collection Overview

- **Collection Name**: `model_showcase_images`
- **Purpose**: Power the "Tiled Wall" feed on individual Model Detail pages.

## Data Schema

Each document in `model_showcase_images` should look like this:

| Field | Type | Description |
| :--- | :--- | :--- |
| `modelId` | String | **Required**. Must match the ID of the model (e.g., `sdxl-v1-0`, `flux-pro`). |
| `imageUrl` | String | **Required**. The full URL to the image (e.g., Backblaze B2 link or Firebase Storage URL). |
| `isCurated` | Boolean | Optional. Set to `true` to indicate this is an official showcase image. |
| `createdAt` | Timestamp | Standard Firestore timestamp for sorting. |

## How to Add Images

### Method 1: Automatic Seeding (Migration)
The application has a built-in "auto-seed" feature.
1. If you navigate to a Model Detail page and **no images exist** in the `model_showcase_images` collection for that model...
2. The app will automatically copy the links from the model's existing `previewImages` array into the `model_showcase_images` collection.
3. This ensures the page is never empty.

### Method 2: Manual Curation (Firebase Console)
To make your model page look its best with specific, high-quality distinct images:

1. Go to the **Firebase Console** -> **Firestore Database**.
2. Start a collection named `model_showcase_images` (if it doesn't exist).
3. **Add Document**:
   - `modelId`: "your-model-id"
   - `imageUrl`: "https://..."
   - `isCurated`: true
4. Repeat for as many images as you want to appear in the "Tiled Wall."

### Method 3: Admin Script (Future)
*Currently, you can use the auto-seeding or manual console entry. In the future, an Admin Dashboard could be built to upload images directly to this collection.*
