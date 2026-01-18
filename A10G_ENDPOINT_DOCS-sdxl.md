# SDXL Modal Endpoint Documentation

## Overview
This service hosts Stable Diffusion XL models on Modal, accessible via a public HTTP Web Endpoint.

**Base URL:** `https://mariecoderinc--sdxl-multi-model-a10g-model-web-app.modal.run`

## Usage (Async API)

This endpoint now uses an **asynchronous job pattern**. You must submit a job and then poll for results.

### 1. Submit Job
**POST** `/generate`

```bash
curl -X POST "https://mariecoderinc--sdxl-multi-model-a10g-model-web-app.modal.run/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "cyberpunk cat",
    "model": "wai-illustrious",
    "steps": 30
  }'
```

**Response (202 Accepted):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

### 2. Poll Status / Get Result
**GET** `/jobs/{job_id}`

```bash
curl "https://mariecoderinc--sdxl-multi-model-a10g-model-web-app.modal.run/jobs/550e8400..."
```

- **If processing:** Returns JSON `{"status": "queued"}` or `{"status": "generating"}`.
- **If complete:** Returns the **Image Binary** (PNG) directly.
- **If failed:** Returns JSON `{"status": "failed", "error": "..."}`.

### 3. Health Check
**GET** `/health`

---

## Python Client Example

```python
import requests
import time

API_URL = "https://mariecoderinc--sdxl-multi-model-a10g-model-web-app.modal.run"

def generate(prompt):
    # 1. Submit
    resp = requests.post(f"{API_URL}/generate", json={"prompt": prompt})
    resp.raise_for_status()
    job_id = resp.json()["job_id"]
    print(f"Job submitted: {job_id}")

    # 2. Poll
    while True:
        status_resp = requests.get(f"{API_URL}/jobs/{job_id}")
        
        # Check Content-Type to see if it's the image
        if status_resp.headers.get("content-type") == "image/png":
            with open("output.png", "wb") as f:
                f.write(status_resp.content)
            print("Done! Saved to output.png")
            break
            
        data = status_resp.json()
        if data["status"] == "failed":
            print(f"Failed: {data.get('error')}")
            break
            
        print(f"Status: {data['status']}...")
        time.sleep(1)

generate("A futuristic city on Mars, cinematic lighting")
```
