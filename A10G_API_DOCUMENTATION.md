# ZIT-model A10G API Documentation

This API provides access to the **A10G-optimized** version of the Z-Image-Turbo (ZIT) image generation model. This pipeline is designed for **stability** and **cost-efficiency**, utilizing a 24GB A10G GPU with aggressive defensive measures to prevent Out-Of-Memory (OOM) errors.

## Endpoint Details

*   **Service Name**: `zit-a10g`
*   **Endpoint URL**: `https://mariecoderinc--zit-a10g-fastapi-app.modal.run/generate`
*   **Method**: `POST`

## Hardening & Stability Features

This pipeline includes specific optimizations for the A10G hardware:

1.  **Memory Fragmentation Prevention**: Sets `PYTORCH_ALLOC_CONF=max_split_size_mb:128` to reduce VRAM fragmentation.
2.  **Pre-Flight VRAM Check**: Proactively restarts the container if free VRAM is below **1.5 GB** before a request starts, ensuring no mid-generation crashes.
3.  **OOM "Suicide Switch"**: If an OOM occurs, the process exits immediately (`sys.exit(1)`), forcing Modal to provision a fresh, clean container for the next request.
4.  **Attention Slicing**: Uses `enable_attention_slicing("max")` for minimal peak memory usage.
5.  **Resolution Snapping**: Inputs are snapped to multiples of 8 (e.g., 1024 -> 1024, 1023 -> 1016) to prevent padding overheads.
6.  **Deep Cleanup**: Utilizes `torch.cuda.ipc_collect()` for thorough memory reclamation between requests.

## API Usage

### Request Body (JSON)

```json
{
  "prompt": "your prompt here",
  "steps": 9,
  "width": 1024,
  "height": 1024,
  "seed": 42
}
```

*   **Max Resolution**: Approx 2.2 Megapixels (e.g., 1536x1536). Requests exceeding this will be rejected.

### Curl Example

```bash
curl -X POST "https://mariecoderinc--zit-a10g-fastapi-app.modal.run/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "cinematic landscape", "width": 1024, "height": 1024}' \
     --output generated_image.png
```

### Python/Modal Client Example

```python
import modal

f = modal.Function.lookup("zit-a10g", "ZITServiceA10G.generate")

png_bytes = f.remote(
    prompt="cyberpunk city street at night, neon lights, rain",
    steps=9,
    width=1024,
    height=1024
)

with open("output.png", "wb") as f:
    f.write(png_bytes)
```

## Deployment

To deploy this specific pipeline:

```bash
modal deploy app_a10g.py
```
