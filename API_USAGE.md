# FLUX.2-klein-4B API Usage

This document explains how to use the deployed `flux-klein-4b` Modal application from your own Python scripts or applications.

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
Model = modal.Cls.lookup("flux-klein-4b", "Model")

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

### `Model.generate`

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

## Web Endpoint (Optional)

If you need to access this via HTTP (e.g., from a Node.js app or curl), you can modify the `flux_modal.py` to add a `@modal.web_endpoint` decorator.

Example modification to `flux_modal.py`:
```python
@app.function()
@modal.web_endpoint(method="POST")
def web_generate(data: dict):
    model = Model()
    png_bytes = model.generate.local(
        prompt=data.get("prompt"),
        height=data.get("height", 1024),
        width=data.get("width", 1024)
    )
    return {"image_bytes": png_bytes.hex()}
```
*Note: This is not currently deployed. Contact the maintainer to enable it.*
