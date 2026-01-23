# Z-Image-Turbo (ZIT) API Documentation

This API allows you to submit image generation jobs to either the H100 or A10G backend services. Both services share the same API schema.

## Base URLs

- **H100 Service (Premium)**: `https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run`
- **A10G Service (Standard)**: `https://mariecoderinc--zit-a10g-fastapi-app.modal.run`

---

## Endpoints

### 1. Health Check
Check operational status.

- **URL**: `/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "z-image-turbo-h100-async-api" // or "z-image-turbo-a10g-async-api"
  }
  ```

### 2. Submit Generation Job
Queue a new image generation task.

- **URL**: `/generate`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "prompt": "A cyberpunk bustling street, neon lights, 8k resolution",
    "steps": 9,                 // Default: 9
    "width": 1024,              // Optional
    "height": 1024,             // Optional
    "aspect_ratio": "16:9",     // Optional (overrides width/height if set)
    "seed": 42,                 // Optional (random if null)
    "webhook_url": "https://..." // Optional callback URL
  }
  ```
- **Response** (202 Accepted):
  ```json
  {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued"
  }
  ```

### 3. Poll for Results
Check job status or retrieve the generated image.

- **URL**: `/result/{job_id}`
- **Method**: `GET`
- **Response Types**:

  **Case A: Completed (Image)**
  - **Status Code**: `200 OK`
  - **Content-Type**: `image/png`
  - **Body**: Binary PNG data.

  **Case B: Processing / Queued**
  - **Status Code**: `200 OK`
  - **Content-Type**: `application/json`
  - **Body**:
    ```json
    {
      "status": "queued", // or "generating"
      "created_at": 1705550000.0,
      "updated_at": 1705550005.0
    }
    ```

  **Case C: Failed**
  - **Status Code**: `200 OK` (JSON)
  - **Body**:
    ```json
    {
      "status": "failed",
      "error": "Detailed error message..."
    }
    ```

  **Case D: Not Found**
  - **Status Code**: `404 Not Found`
  - **Body**: `{"error": "Job not found"}`

---

## Supported Aspect Ratios
If `aspect_ratio` is provided, it maps to the following resolutions:

| Ratio | Resolution |
|-------|------------|
| 1:1 | 1024 x 1024 |
| 16:9 | 1344 x 768 |
| 9:16 | 768 x 1344 |
| 4:3 | 1152 x 864 |
| 3:4 | 864 x 1152 |
| 21:9 | 1536 x 640 |
| 9:21 | 640 x 1536 |

## Webhooks
If `webhook_url` is provided, the service will send a POST request upon completion or failure.

**Payload**:
```json
{
  "job_id": "...",
  "status": "completed" // or "failed"
  // "error": "..." (if failed)
}
```
