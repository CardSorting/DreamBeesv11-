# FLUX.2-klein-4B API Usage

This document explains how to use the deployed `flux-klein-4b` Modal application from your own Python scripts or applications.

## Deployment Info

| Item | Value |
|------|-------|
| **Production URL** | `https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run` |
| **App Dashboard** | [modal.com/apps/mariecoderinc/main/deployed/flux-klein-4b](https://modal.com/apps/mariecoderinc/main/deployed/flux-klein-4b) |
| **Last Deployed** | 2026-01-17 |
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

# Connect to the deployed model
Model = modal.Cls.lookup("flux-klein-4b", "FluxModel")

# Create an instance
model = Model()

# Generate an image
# Returns the PNG image as bytes
print("Generating image...")
image_bytes = model.generate.remote(
    prompt="A cyberpunk street at night with neon rain",
    height=1024,
    width=1024,
    num_steps=4,
    seed=42
)

# Save the result
with open("output.png", "wb") as f:
    f.write(image_bytes)

print("Saved to output.png")
```

## Function Signature

### `FluxModel.generate`

```python
def generate(
    self, 
    prompt: str, 
    height: int = 1024, 
    width: int = 1024, 
    num_steps: int = 4, 
    seed: int = 42
) -> bytes:
    ...
```

- **prompt** _(str)_: The text description of the image to generate.
- **height** _(int)_: Image height (default 1024).
- **width** _(int)_: Image width (default 1024).
- **num_steps** _(int)_: Number of inference steps (default 4).
- **seed** _(int)_: Random seed for reproducibility.

## Performance Notes
- **Cold Start**: The first request (if the app has been idle) might take ~1 minute to load, but the model is cached in a Volume so it won't re-download.
- **Warm Generation**: Subsequent requests typically take **~4-6 seconds** on the A10G GPU.

## Web Endpoint (FastAPI - Async Job Pattern)

The API now uses an asynchronous "submit and poll" pattern. This is more robust for long-running image generation tasks and prevents HTTP timeouts.

### 1. Submit Generation Job
**POST** `/generate`

```bash
curl -X POST "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "A futuristic city in the style of cyberpunk"
     }'
```

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
You can provide a `webhook_url` in the generate request. The API will POST a JSON notification once the job is finished or failed.

```bash
curl -X POST "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "A futuristic city",
       "webhook_url": "https://your-app.com/api/webhooks/image-gen"
     }'
```

### Production Guardrails & Optimization
The API is optimized for high-volume production use:

- **Result Caching**: Identical requests (same prompt, seed, etc.) return instantly from the cache, saving GPU costs and time. Disable with `"use_cache": false`.
- **Rate Limiting**: Limited to **60 requests per minute** per client IP.
- **Circuit Breaker**: If the failure rate exceeds 50%, the endpoint automatically enters a "cool down" mode to protect the backend.
- **Queue Throttling**: The API rejects new jobs if the processing queue exceeds 50 items.
- **Safety Filtering**: Simple filtering is applied to block harmful prompts.

### Advanced Request Body (JSON)

- **prompt** _(string, required)_: 1-5000 chars.
- **height/width** _(int, optional)_: 256-1536 (default 1024).
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

# Generate an image
JOB_ID=$(curl -s -X POST "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A majestic dragon flying over mountains"}' | jq -r '.job_id')

echo "Job ID: $JOB_ID"

# Wait a few seconds, then download the result
sleep 10
curl "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run/result/$JOB_ID" --output dragon.png
```
