# ZIT-model API Documentation

This API provides access to the Z-Image-Turbo (ZIT) image generation model hosted on Modal. It is optimized for low-latency generation using SDNQ quantization and memory snapshots.

## Service: `ZITService`

The main entry point is the `ZITService` class.

### Method: `generate`

Generates an image based on the provided prompt.

**Signature:**

```python
def generate(
    self,
    prompt: str,
    steps: int = 8,
    width: int = 1024,
    height: int = 1024,
    seed: int | None = None,
) -> bytes:
```

**Parameters:**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | `str` | *Required* | The text prompt to generate the image from. |
| `steps` | `int` | `9` | Number of inference steps. Recommended: 9. |
| `aspect_ratio` | `str` | `None` | Optional aspect ratio (e.g., "16:9", "1:1", "9:16"). Overrides width/height if set. |
| `width` | `int` | `1024` | Width of the generated image. Ignored if `aspect_ratio` is set. |
| `height` | `int` | `1024` | Height of the generated image. Ignored if `aspect_ratio` is set. |
| `seed` | `int \| None` | `None` | Random seed for reproducibility. |

**Supported Aspect Ratios:**
*   `1:1` (1024x1024)
*   `16:9` (1344x768)
*   `9:16` (768x1344)
*   `4:3` (1152x864)
*   `3:4` (864x1152)
*   `21:9` (1536x640)
*   `9:21` (640x1536)

**Returns:**

*   `bytes`: The generated image data in PNG format.

### Usage Example

To use this endpoint, you need the `modal` client installed (`pip install modal`).

```python
import modal

# Connect to the deployed function
f = modal.Function.lookup("zit-only", "ZITService.generate")

# Call the function remotely
png_bytes = f.remote(
    prompt="cyberpunk city street at night, neon lights, rain",
    steps=9,
    aspect_ratio="21:9"
)

# Save the result
with open("output.png", "wb") as f:
    f.write(png_bytes)
    print("Image saved to output.png")
```

## HTTP API

You can also use the deployed FastAPI endpoint directly via HTTP.

**Endpoint:** `https://cardsorting--zit-only-fastapi-app.modal.run/generate`  
**Method:** `POST`

**Request Body (JSON):**

```json
{
  "prompt": "your prompt here",
  "steps": 9,
  "aspect_ratio": "16:9",
  "seed": 42
}
```

**Curl Example:**

```bash
curl -X POST "https://cardsorting--zit-only-fastapi-app.modal.run/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "cinematic landscape", "aspect_ratio": "21:9"}' \
     --output generated_image.png
```


## Setup & Deployment

1.  **Download Weights**:
    Initialize the Modal Volume with the model weights:
    ```bash
    modal run app.py::download_model
    ```

2.  **Deploy**:
    Deploy the API to Modal:
    ```bash
    modal deploy app.py
    ```

3.  **Cold Starts**:
    The service is configured with `enable_memory_snapshot=True`. The first request after deployment or scale-up may take slightly longer (though optimized by the snapshot), but subsequent requests will benefit from the restored memory state.
