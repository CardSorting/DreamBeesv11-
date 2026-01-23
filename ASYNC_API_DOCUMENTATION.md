# Async Image Generation API (A10G & H100)

This API provides high-throughput, fault-tolerant text-to-image generation using an **Asynchronous Job Pattern**. It supports two hardware tiers with identical API signatures.

## Base URLs

| Tier | Description | Base URL |
|------|-------------|----------|
| **A10G** | Standard, Cost-Effective | `https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run` |
| **H100** | High Performance, Low Latency | `https://mariecoderinc--sdxl-multi-model-h100-model-web.modal.run` |

---

## Available Models

| Model ID | Description / Filename |
|----------|------------------------|
| `nova-furry-xl` | `novaFurryXL_ilV140.safetensors` |
| `perfect-illustrious` | `perfectrsbmixIllustrious_definitivelambda.safetensors` |
| `gray-color` | `graycolor_v17.safetensors` |
| `scyrax-pastel` | `scyraxPastelCore_v121.safetensors` |
| `ani-detox` | `aniDetox_sketchsmith.safetensors` |
| `animij-v7` | `animij_v7.safetensors` |
| `swijtspot-no1` | `swijtspot_no1.safetensors` |
| `wai-illustrious` | `waiIllustriousSDXL_v160.safetensors` (Default) |

| `rin-anime-blend` | `rinAnimeBlendArblend_v30.safetensors` |
| `rin-anime-popcute` | `rinAnimepopcute_v30.safetensors` |
| `crystal-cuteness` | `CrystalCuteness.safetensors` |
| `veretoon-v10` | `veretoon_v10.safetensors` |

---

## Model-Specific Optimizations

The system now implements automatic parameter tuning and prompt processing for specific models to ensure high-quality results by default.

### 1. Automated Defaults
For specific models, the API will automatically adjust settings if you don't provide them:
- **`wai-illustrious`**:
    - **Hires-Fix**: Automatically enabled for improved detail.

---

## 1. Submit Generation Job
**Endpoint:** `POST {BASE_URL}/generate`

Spawns a background task on the GPU. Returns immediately with a `job_id`.

### Request Body
```json
{
  "prompt": "1girl, solo, anime style, colorful",
  "model": "wai-illustrious", // Options: "nova-furry-xl", "perfect-illustrious", "gray-color", "scyrax-pastel", "ani-detox", "animij-v7", "swijtspot-no1", "wai-illustrious", "rin-anime-blend", "rin-anime-popcute", "crystal-cuteness", "veretoon-v10"
  "steps": 30,              // Default: 30
  "width": 1024,            // Default: 1024
  "height": 1024,           // Default: 1024
  "aspect_ratio": "16:9",   // Optional: Overrides width/height. Values: "1:1", "16:9", "9:16", "21:9", "9:21", "3:2", "2:3", "4:5", "5:4"
  "seed": 12345,            // Optional
  "webhook_url": "https://your-api.com/hooks/image-done" // Optional
}
```

### Response
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

---

## 2. Poll Status / Get Result
**Endpoint:** `GET {BASE_URL}/result/{job_id}`

Check the status of a job or retrieve the final image.

### Status Response (JSON)
Returned when status is `queued`, `generating`, or `failed`.
```json
{
  "status": "generating",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_at": 1705512345.123
}
```
OR
```json
{
  "status": "failed",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "error": "Resolution 2048x2048 exceeds maximum allowed pixels.",
  "updated_at": 1705512345.999
}
```

### Success Response (Binary)
Returned when status is `completed`.
- **Content-Type**: `image/png`
- **Body**: Raw PNG bytes.
- **Note**: If the file is missing but the job is marked completed, it falls back to a JSON status response.

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
**Endpoint:** `GET {BASE_URL}/`

Returns a simple HTML status page indicating the service is online.

---

## Python Example (Client)

```python
import requests
import time

# Choose your tier
BASE_URL = "https://mariecoderinc--sdxl-multi-model-h100-model-web.modal.run"
# BASE_URL = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run"

def generate_image(prompt):
    # 1. Submit
    resp = requests.post(f"{BASE_URL}/generate", json={
        "prompt": prompt,
        "model": "wai-illustrious",
        "aspect_ratio": "16:9"
    })
    resp.raise_for_status()
    data = resp.json()
    job_id = data["job_id"]
    print(f"Job submitted: {job_id}")

    # 2. Poll
    while True:
        status_resp = requests.get(f"{BASE_URL}/result/{job_id}")
        
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
