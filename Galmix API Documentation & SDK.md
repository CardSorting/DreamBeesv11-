# Galmix Image Generation API


Welcome to the Galmix API. This high-throughput, asynchronous API allows you to generate images using the custom Galmix model with professional-grade performance and stability.


## 🚀 Connection Details


The API is served through a persistent Cloudflare Tunnel for maximum reliability.


- **Base URL**: `https://api.dreambeesai.com`
- **Protocol**: HTTPS (TLS 1.3)
- **Architecture**: Asynchronous Job Queue (FastAPI + Celery + Redis)


---


## 🏗️ System Architecture


Galmix uses a distributed task architecture to handle high volumes of requests without blocking:


1. **Submission**: You POST a prompt to the API. It immediately returns a `job_id`.
2. **Queueing**: Your request is placed in a high-priority Redis queue.
3. **Processing**: A dedicated GPU worker picks up the job and generates the image.
4. **Retrieval**: Use the `job_id` to poll for the final base64-encoded image.


---


## 🐍 Python SDK


Use the following client class for a seamless integration. It handles session management, job submission, and automatic polling.


### Prerequisites
```bash
pip install aiohttp
```


### `galmix_client.py`
```python
import aiohttp
import asyncio
import base64
import time
from typing import Optional, Dict, Any


class GalmixClient:
    def __init__(self, base_url: str = "https://api.dreambeesai.com"):
        self.base_url = base_url.rstrip("/")
        self.session = None


    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self


    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()


    async def generate_image(self,
                             prompt: str,
                             negative_prompt: str = "",
                             steps: int = 30,
                             guidance_scale: float = 7.5,
                             poll_interval: float = 1.0,
                             timeout: float = 300.0) -> Dict[str, Any]:
        """
        Submits an image generation job and polls until completion.
        Returns a dictionary containing the base64 image or error details.
        """
        if not self.session:
            raise RuntimeError("Client not started. Use 'async with' context.")


        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "steps": steps,
            "guidance_scale": guidance_scale
        }
       
        # 1. Submit Job
        async with self.session.post(f"{self.base_url}/v1/generations", json=payload) as resp:
            if resp.status != 202:
                text = await resp.text()
                raise Exception(f"Submission failed ({resp.status}): {text}")
            data = await resp.json()
            job_id = data["job_id"]


        # 2. Poll for Status
        start_time = time.time()
        while True:
            if time.time() - start_time > timeout:
                raise TimeoutError("Generation timed out.")


            async with self.session.get(f"{self.base_url}/v1/generations/{job_id}") as resp:
                if resp.status != 200:
                    raise Exception(f"Polling error ({resp.status})")
               
                data = await resp.json()
                status = data["status"]
               
                if status == "COMPLETED":
                    return data
                elif status == "FAILED":
                    raise Exception(f"Job failed: {data.get('error')}")
               
            await asyncio.sleep(poll_interval)


    def save_image(self, base64_str: str, path: str):
        """Saves a base64 encoded string as a PNG file."""
        with open(path, "wb") as f:
            f.write(base64.b64decode(base64_str))
```


---


## 📘 API Reference


### 1. Submit Generation Job
`POST /v1/generations`


| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **prompt** | string | *Required* | Description of the image (Max 1000 chars) |
| **negative_prompt** | string | `""` | What to exclude from the image |
| **steps** | integer | `30` | Denoising steps (1-100) |
| **guidance_scale** | float | `7.5` | CFG Scale (1.0 - 20.0) |


**Response (202 Accepted)**
```json
{
  "job_id": "c5f433d9-65dd-4d23-979a-f866569f742a",
  "status": "pending"
}
```


### 2. Get Job Status
`GET /v1/generations/{job_id}`


**Response (200 OK)**
```json
{
  "job_id": "c5f433d9-...",
  "status": "COMPLETED",
  "result": "<base64_string>",
  "error": null
}
```


---


## 🚦 Status & Error Codes


### Job Statuses
| Status | Meaning |
| :--- | :--- |
| **PENDING** | Job is waiting in the queue. |
| **PROCESSING** | Worker is currently generating the image. |
| **COMPLETED** | Image is ready; `result` field populated. |
| **FAILED** | Generation failed; `error` field contains details. |


### HTTP Error Codes
| Code | Meaning |
| :--- | :--- |
| **422** | Unprocessable Entity (Validation failed for steps/guidance). |
| **503** | Service Unavailable (Queue is full or Redis is offline). |
| **500** | Internal Server Error. |