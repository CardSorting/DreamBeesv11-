# FLUX.2-klein-4B API Usage

This document explains how to use the deployed `flux-klein-4b` Modal application from your own Python scripts or applications.

## Deployment Info

| Item | Value |
|------|-------|
| **Production URL** | `https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run` |
| **App Dashboard** | [modal.com/apps/mariecoderinc/main/deployed/flux-klein-4b](https://modal.com/apps/mariecoderinc/main/deployed/flux-klein-4b) |
| **Last Deployed** | 2026-01-30 |
| **GPU** | NVIDIA A10G (24GB VRAM) |
| **Model** | FLUX.2-klein-4B |

## Prerequisites

You need the `modal` client installed and authenticated:

```bash
pip install modal
modal setup
```

## Python Client Usage

You can invoke the model from any Python script using `modal.Cls.lookup`.

```python
import modal
import base64

# Connect to the deployed model
Model = modal.Cls.lookup("flux-klein-4b", "FluxModel")

# Create an instance
model = Model()

# Encode your init image
with open("input.png", "rb") as f:
    input_image_b64 = base64.b64encode(f.read()).decode("utf-8")

# Edit the image
# Returns the PNG image as bytes
print("Editing image...")
job_id = "test-job" # Manually managed job ID for direct remote call if needed, 
# but typically you use the web endpoint for async jobs.
# Note: The direct 'edit_job' method returns a dict with the result hex.
# For simpler usage, we recommend using the Web Endpoint below.
```

## Web Endpoint (FastAPI - Async Job Pattern)

The API uses an asynchronous "submit and poll" pattern. This is more robust for long-running image editing tasks and prevents HTTP timeouts.

### 1. Submit Edit Job
**POST** `/edit`

```bash
curl -X POST "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/edit" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Make it a cyberpunk city",
       "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII=", 
       "strength": 0.8
     }'
```
*(Note: The `image` field must be a Base64 encoded string of your input image)*

**Response (JSON):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

### 2. Poll for Result
**GET** `/result/{job_id}`

```bash
curl "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/result/550e8400-e29b-41d4-a716-446655440000" --output output.png
```

- If the job is **still processing**, it returns a JSON status: `{"status": "generating"}`.
- If the job is **completed**, it returns the PNG image directly.
- If the job **failed**, it returns a JSON error: `{"status": "failed", "error": "..."}`.

### Optional: Webhook Notifications
You can provide a `webhook_url` in the edit request. The API will POST a JSON notification once the job is finished or failed.

```bash
curl -X POST "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/edit" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Make it snowy",
       "image": "...",
       "webhook_url": "https://your-app.com/api/webhooks/image-edit"
     }'
```

### Production Guardrails & Optimization
The API is optimized for high-volume production use:

- **Result Caching**: Identical requests (same prompt, image, seed, etc.) return instantly from the cache. Disable with `"use_cache": false`.
- **Rate Limiting**: Limited to **60 requests per minute** per client IP.
- **Circuit Breaker**: If the failure rate exceeds 50%, the endpoint automatically enters a "cool down" mode to protect the backend.
- **Queue Throttling**: The API rejects new jobs if the processing queue exceeds 50 items.
- **Safety Filtering**: Simple filtering is applied to block harmful prompts.

### Advanced Request Body (JSON)

- **prompt** _(string, required)_: 1-5000 chars.
- **image** _(string, required)_: Base64 encoded input image.
- **strength** _(float, optional)_: 0.0 to 1.0 (default 0.75). Higher means more change to the original image.
- **height/width** _(int, optional)_: 256-1536 (default 1024). Output dimensions.
- **use_cache** _(bool, optional)_: Default `true`.
- **webhook_url** _(string, optional)_: Callback for completed jobs.

### Health Check & Status

**GET** `/health` - Returns the overall system status.

```bash
curl https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/health
```

**GET** `/result/{job_id}` - Returns the image or the current status of a job.

---

## Quick Test

```bash
# Health check
curl https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/health

# Edit an image (Assuming you have an input image base64 string)
# ... use your preferred tool to base64 encode an image ...
```
