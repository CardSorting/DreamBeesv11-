# ZIT-model API Documentation

This API provides access to the Z-Image-Turbo (ZIT) image generation model hosted on Modal. It is optimized for H100 GPUs using the `Tongyi-MAI/Z-Image-Turbo` base model and `torch.compile` for high performance.

### HTTP API

You can use the Z-Image-Turbo (ZIT) image generation model hosted on Modal via the FastAPI endpoint directly via HTTP.

**Endpoint:** `https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/generate`  
**Method:** `POST`

**Request Body (JSON):**

```json
{
  "prompt": "your prompt here",
  "steps": 8,
  "aspect_ratio": "16:9",
  "seed": 42
}
```

**Curl Example:**

```bash
curl -X POST "https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/generate" \
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

3.  **H100 Optimization**:
    The service is specifically optimized for H100 Tensor Cores with TF32 enabled and utilizes `torch.compile` on the VAE for faster decoding. The first request will trigger compilation; subsequent requests are low-latency.

