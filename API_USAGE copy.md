# FLUX.2-klein-4B API Usage

This document explains how to use the deployed `flux-klein-4b` Modal application from your own Python scripts or applications.

## Deployment Info

| Item | Value |
|------|-------|
| **Production URL** | `https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run` |
| **App Dashboard** | [modal.com/apps/mariecoderinc/main/deployed/flux-klein-4b](https://modal.com/apps/mariecoderinc/main/deployed/flux-klein-4b) |
| **Last Deployed** | 2026-01-31 (v1.0.4) |
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

# Edit the image directly (Sync Job)
payload = {
    "prompt": "a futuristic landscape",
    "image": "https://example.com/base.jpg", # Or base64 string
    "width": 1024,
    "height": 1024,
    "num_steps": 4,
    "seed": 42
}

# The .remote() call triggers the job on Modal
# result is a dictionary: {"status": "completed", "result": "<HEX_STRING>", ...}
print("Submitting job...")
result = model.edit_job.remote("my-unique-job-id", payload)

if result["status"] == "completed":
    image_bytes = bytes.fromhex(result["result"])
    with open("output.png", "wb") as f:
        f.write(image_bytes)
    print("Success! Saved as output.png")
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
        "image": "https://example.com/city.jpg", 
        "num_steps": 10
      }'
```
*(Note: The `image` field accepts either a Base64 encoded string OR a public URL. URLs are automatically fetched with retries.)*

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
- **URL Retries**: Image URLs are fetched with automatic retries and exponential backoff to handle transient network issues.
- **Rate Limiting**: Limited to **60 requests per minute** per client IP.
- **Circuit Breaker**: Trips on internal failures (500s). Client errors (invalid images, bad prompts) are ignored to ensure high availability for others.
- **Queue Throttling**: The API rejects new jobs if the processing queue exceeds 100 items (tracked in $O(1)$).
- **Safety Filtering**: Simple filtering is applied to block harmful prompts.

### Advanced Request Body (JSON)

- **prompt** _(string, required)_: 1-5000 chars.
- **image** _(string, required)_: Base64 encoded input image OR public URL.
- **height/width** _(int, optional)_: 256-1536 (default 1024). Output dimensions.
- **num_steps** _(int, optional)_: 1-20 (default 4).
- **seed** _(int, optional)_: Initial random seed (default 42).
- **use_cache** _(bool, optional)_: Default `true`. If `true`, returns cached results for identical inputs.
- **webhook_url** _(string, optional)_: Callback URL that receives a POST with `{"job_id": "...", "status": "completed"|"failed"}`.

### Health Check & Status

**GET** `/health` - Returns the overall system status.

```bash
curl https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/health
```

**GET** `/result/{job_id}` - Returns the image or the current status of a job.

---

## Quick Test

### 1. Health Check
```bash
curl https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/health
# Response: {"status": "healthy", "model": "flux.2-klein-4b", "version": "1.0.4-FIXED-LEN-DICT"}
```

### 2. Submit URL-based Edit
```bash
curl -X POST "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/edit" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "change the sky to a neon aurora",
       "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
       "num_steps": 4
     }'
```
