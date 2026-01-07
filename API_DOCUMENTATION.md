# Qwen-Image-2512 API Documentation

This API allows you to generate images using the Qwen-Image-2512 model deployed on Modal.

## Endpoint

**URL**: `https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run`

**Method**: `POST`

## Request Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

## Request Body

The API accepts a JSON object with the following parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | The text description of the image to generate. |
| `negative_prompt` | string | No | "" | Text describing what to exclude from the image. |
| `aspect_ratio` | string | No | "16:9" | Aspect ratio of the output image. |

**Available Aspect Ratios:**
- "1:1" (1280x1280)
- "16:9" (1584x896)
- "9:16" (896x1584)
- "4:3" (1440x1080)
- "3:4" (1080x1440)
- "3:2" (1584x1056)
- "2:3" (1056x1584)

## Response

- **Content-Type**: `image/png`
- **Body**: Binary PNG image data.

## Usage Examples

### cURL

```bash
curl -X POST "https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city floating in the clouds, golden hour lighting",
    "negative_prompt": "low quality, blur",
    "aspect_ratio": "16:9"
  }' \
  --output generated_image.png
```

### Python

```python
import requests

url = "https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run"

payload = {
    "prompt": "A majestic lion sitting on a throne, digital art style",
    "negative_prompt": "deformed, blurry",
    "aspect_ratio": "1:1"
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("output.png", "wb") as f:
        f.write(response.content)
    print("Image saved successfully!")
else:
    print(f"Error: {response.status_code} - {response.text}")
```
