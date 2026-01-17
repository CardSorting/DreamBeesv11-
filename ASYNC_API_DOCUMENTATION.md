# Async Image Generation API (A10G & H100)

This API provides high-throughput, fault-tolerant text-to-image generation using an **Asynchronous Job Pattern**. It supports two hardware tiers:
- **A10G (Standard)**: Cost-effective, suitable for most workloads.
- **H100 (High-Performance)**: Lowest latency, maximum throughput for bursts.

## Base URLs

| Tier | Application | Base URL |
|------|-------------|----------|
| **A10G** | `app_a10g.py` | `https://mariecoderinc--zit-a10g-fastapi-app.modal.run` |
| **H100** | `app.py` | `https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run` |

---

## 1. Submit Generation Job
**Endpoint:** `POST /generate`

Spawns a background task on the GPU. Returns immediately with a `job_id`.

### Request Body
```json
{
  "prompt": "Distal surrealism, neon amber lights, 8k resolution",
  "steps": 9,               // Default: 9
  "width": 1024,            // Default: 1024
  "height": 1024,           // Default: 1024
  "aspect_ratio": "16:9",   // Optional: Overrides width/height
  "seed": 12345,            // Optional
  "webhook_url": "https://your-api.com/hooks/image-done" // Optional
}
```

### Response (202 Accepted)
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

---

## 2. Poll Status / Get Result
**Endpoint:** `GET /result/{job_id}`

Check the status of a job or retrieve the final image.

### Status Response (JSON)
Returned when status is `queued`, `generating`, or `failed`.
```json
{
  "status": "generating",
  "updated_at": 1705512345.123
}
```
OR
```json
{
  "status": "failed",
  "error": "Resolution 2048x2048 exceeds maximum allowed pixels.",
  "updated_at": 1705512345.999
}
```

### Success Response (Binary)
Returned when status is `completed`.
- **Content-Type**: `image/png`
- **Body**: Raw PNG bytes.

---

## 3. Webhooks (Optional)
If `webhook_url` is provided, the API will send a POST request upon completion or failure.

**Success Webhook Payload:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

**Failure Webhook Payload:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "error": "OOM detected"
}
```

---

## 4. Health Check
**Endpoint:** `GET /health`

Use this for load balancers or keep-alive checks.
```json
{
  "status": "healthy",
  "service": "zit-a10g-async" // or zit-h100-async
}
```

---

## Python Example (Client)

```python
import requests
import time

# Choose endpoint
API_URL = "https://mariecoderinc--zit-a10g-fastapi-app.modal.run"
# API_URL = "https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run"

def generate_image(prompt):
    # 1. Submit
    resp = requests.post(f"{API_URL}/generate", json={"prompt": prompt})
    resp.raise_for_status()
    job_id = resp.json()["job_id"]
    print(f"Job submitted: {job_id}")

    # 2. Poll
    while True:
        status_resp = requests.get(f"{API_URL}/result/{job_id}")
        
        # If we get an image directly (Completion)
        if status_resp.headers.get("content-type") == "image/png":
            with open("output.png", "wb") as f:
                f.write(status_resp.content)
            print("Image saved to output.png")
            break
            
        # If JSON (Status Update)
        data = status_resp.json()
        if data["status"] == "failed":
            print(f"Job failed: {data.get('error')}")
            break
        
        print(f"Status: {data['status']}...")
        time.sleep(1)

if __name__ == "__main__":
    generate_image("A futuristic city on Mars, cinematic lighting")
```
