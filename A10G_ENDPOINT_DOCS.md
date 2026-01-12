# SDXL Modal Endpoint Documentation

## Overview
This service hosts Stable Diffusion XL models on Modal, accessible via a public HTTP Web Endpoint.

**Base URL:** `https://mariecoderinc--sdxl-multi-model-a10g-model-web-inference.modal.run`

## Usage

### Web Endpoint (HTTP)

You can call the endpoint directly using HTTP GET requests.

**URL:** `https://mariecoderinc--sdxl-multi-model-a10g-model-web-inference.modal.run`

#### Parameters (Query String)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | `str` | **Required** | The text prompt for image generation. |
| `model` | `str` | `"wai-illustrious"` | The model to use. Options: `"wai-illustrious"`, `"nova-furry-xl"`, `"perfect-illustrious"`, `"gray-color"`, `"scyrax-pastel"`, `"ani-detox"`, `"animij-v7"`, `"swijtspot-no1"`. |
| `negative_prompt` | `str` | `""` | Items to exclude from the image. |
| `steps` | `int` | `30` | Number of inference steps. Recommended: 25-30. |
| `cfg` | `float` | `7.0` | Guidance scale. Recommended: 5.0-7.0. |
| `scheduler` | `str` | `"Euler a"` | Scheduler logic. Options: `"Euler a"`, `"DPM++ 2M Karras"`. |
| `width` | `int` | `None` | Width of the image. Max total pixels: 1.5MP (e.g. 1024x1024). |
| `height` | `int` | `None` | Height of the image. Max total pixels: 1.5MP (e.g. 832x1216). |

> **Note:** The `"nova-furry-xl"` model automatically prepends specific quality and activation tags to your prompt.
> **Note:** The `"wai-illustrious"` model enforces specific quality tags (`masterpiece, best quality...`).
> **Limit:** Resolution is strictly capped at **1.5 Megapixels** (width * height <= 1,572,864). 2048x2048 is NOT supported on A10G.

#### Example: API Request
```bash
curl -o output.png "https://mariecoderinc--sdxl-multi-model-a10g-model-web-inference.modal.run?prompt=cyberpunk%20cat&model=wai-illustrious&steps=30"
```

#### Swagger UI
You can view the interactive API documentation (Swagger UI) at:
`https://mariecoderinc--sdxl-multi-model-a10g-model-web-inference.modal.run/docs`

---

## Python Client (Modal API)
Alternatively, you can still use the Modal Python client for internal usage.

```python
import modal

def generate_image():
    Model = modal.Cls.lookup("sdxl-multi-model-a10g", "Model")
    image_bytes = Model().run_inference.remote(
        prompt="A photo of a cyberpunk city",
        scheduler="DPM++ 2M Karras",
        steps=30,
        cfg=7.0
    )
    with open("output_rpc.png", "wb") as f:
        f.write(image_bytes)
```
