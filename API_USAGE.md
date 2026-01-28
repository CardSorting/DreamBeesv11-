# Z-Image-Turbo (ZIT) H100 API Usage

Base URL: `https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run`

## Health Check
**Endpoint**: `GET /health`

Returns the service status.

**Example**:
```bash
curl https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/health
```

**Response**:
```json
{"status": "healthy", "service": "z-image-turbo-h100-async-api"}
```

---

## Submit Generation Job
**Endpoint**: `POST /generate`

Submits a new image generation job. The job is processed asynchronously on an H100 GPU.

**Parameters (JSON body)**:
- `prompt` (string, required): The text prompt for generation.
- `steps` (integer, optional, default: 9): Number of inference steps (1-50).
- `width` (integer, optional): Image width (64-2048).
- `height` (integer, optional): Image height (64-2048).
- `aspect_ratio` (string, optional): Presets like "1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21". Overrides width/height if both present.
- `seed` (integer, optional): Random seed for reproducibility.
- `webhook_url` (string, optional): URL to call when the job completes or fails.

**Example**:
```bash
curl -X POST https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cyberpunk city with neon lights",
    "steps": 9,
    "aspect_ratio": "16:9"
  }'
```

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

---

## Poll for Results
**Endpoint**: `GET /result/{job_id}`

Retrieves the status or the final image of a job.

- If **queued** or **generating**: Returns JSON status.
- If **completed**: Returns the raw PNG image bytes.
- If **failed**: Returns JSON error details.

**Example**:
```bash
curl https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/result/550e8400-e29b-41d4-a716-446655440000 --output result.png
# (Inspect response headers or content to determine if it is JSON or image)
```

**Response (In Progress)**:
```json
{
  "status": "generating",
  "updated_at": 1700000000.0
}
```

**Response (Success)**:
[Binary PNG Data]

**Response (Failure)**:
```json
{
  "status": "failed",
  "error": "Detail specific error message"
}
```

---

# Z-Image-Turbo (ZIT) A10G API Usage

Base URL: `https://mariecoderinc--zit-a10g-fastapi-app.modal.run`

## Health Check
**Endpoint**: `GET /health`

**Example**:
```bash
curl https://mariecoderinc--zit-a10g-fastapi-app.modal.run/health
```

**Response**:
```json
{"status": "healthy", "service": "z-image-turbo-a10g-async-api"}
```

## Submit Generation Job
**Endpoint**: `POST /generate`

Same parameters as H100 API.

**Example**:
```bash
curl -X POST https://mariecoderinc--zit-a10g-fastapi-app.modal.run/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cyberpunk city with neon lights",
    "steps": 9
  }'
```

## Poll for Results
**Endpoint**: `GET /result/{job_id}`

Same polling mechanism as H100 API.

**Example**:
```bash
curl https://mariecoderinc--zit-a10g-fastapi-app.modal.run/result/{job_id} --output result.png
```

---

# Z-Image (Base) H100 API Usage

Base URL: `https://mariecoderinc--zit-h100-stable-base-fastapi-app.modal.run`

## Health Check
**Endpoint**: `GET /health`

**Example**:
```bash
curl https://mariecoderinc--zit-h100-stable-base-fastapi-app.modal.run/health
```

**Response**:
```json
{"status": "healthy", "service": "z-image-base-h100-async-api"}
```

## Submit Generation Job
**Endpoint**: `POST /generate`

Submits a new image generation job using the high-quality base model.

**Parameters (JSON body)**:
- Same as H100 Turbo, but `steps` defaults to **28** (recommended range 28-50).
- `guidance_scale` is internally set to 5.0 for the base model.

**Example**:
```bash
curl -X POST https://mariecoderinc--zit-h100-stable-base-fastapi-app.modal.run/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hyper-realistic portrait of a cyborg, cinematic lighting",
    "steps": 28
  }'
```

## Poll for Results
**Endpoint**: `GET /result/{job_id}`

Same polling mechanism as other ZIT APIs.

**Example**:
```bash
curl https://mariecoderinc--zit-h100-stable-base-fastapi-app.modal.run/result/{job_id} --output result.png
```
