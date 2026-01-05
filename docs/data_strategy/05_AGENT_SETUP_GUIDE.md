# 05. LMM Agent Setup Guide (Developer Guidelines)

This document provides technical guidelines for developers implementing the **LMM Worker Agent**. This agent is responsible for the asynchronous enrichment of the `training_feedback` collection.

## 1. System Requirements

The Worker Agent is designed to be **stateless** and **platform-agnostic**. It can run on:
-   **Local Machine** (for development)
-   **Google Cloud Run** (Recommended for production)
-   **AWS Lambda / EC2**
-   **Kubernetes**

### Tech Stack
-   **Language**: Python 3.10+ (Recommended for strong ML libraries support)
-   **SDKs**: `firebase-admin`, `google-generativeai` (or OpenAI/Anthropic SDKs)
-   **Concurrency**: `asyncio` (for high-throughput processing)

---

## 2. Environment Setup

### A. Service Account
1.  Go to **Firebase Console** -> **Project Settings** -> **Service Accounts**.
2.  Generate a new private key (`service-account.json`).
3.  **Roles Required**:
    -   `Cloud Datastore User` (Read/Write Firestore)
    -   `Vertex AI User` (If using Gemini) OR External API Access (If using GPT-4)

### B. Dependencies
Create a `requirements.txt`:
```txt
firebase-admin==6.2.0
google-generativeai==0.3.0
asyncio
aiohttp
```

---

## 3. The Agent Implementation Pattern

The agent should follow the **"Peek-Lock-Process"** pattern to ensure reliability.

### The Code (`worker_agent.py`)

```python
import asyncio
import os
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai

# A. Initialize SDKs
cred = credentials.Certificate('service-account.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-pro-vision')

async def process_task(doc):
    """
    Processes a single feedback document.
    """
    data = doc.to_dict()
    feedback_id = doc.id
    task = data.get('agent_task')
    
    if not task:
        print(f"[SKIP] {feedback_id} - No agent_task found")
        return

    print(f"[START] Processing {feedback_id}...")

    try:
        # B. Load Image
        # Note: In production, use an aiohttp session to fetch the image bytes
        image_url = task['input']['image_url']
        # image_blob = await fetch_image(image_url) 
        
        # C. Call LMM (Stateless Execution)
        # We simply pass the instruction_template + user inputs
        prompt = f"{task['instruction_template']}\n\nContext: {task['input']['user_prompt']}"
        
        # response = await model.generate_content_async([prompt, image_blob])
        # result = parse_json(response.text)
        
        # Mock Result for this example
        result = {
            "aesthetic_score": 8.5,
            "generated_caption": "A futuristic city with neon lights...",
            "tags": ["cyberpunk", "neon", "city", "night"]
        }

        # D. Write Result (Atomic Update)
        doc.reference.update({
            'enrichment.status': 'completed',
            'enrichment.aesthetic_score': result['aesthetic_score'],
            'enrichment.generated_caption': result['generated_caption'],
            'enrichment.tags': result['tags'],
            'enrichment.processed_at': firestore.SERVER_TIMESTAMP
        })
        print(f"[DONE] {feedback_id} enriched.")

    except Exception as e:
        print(f"[ERROR] {feedback_id}: {str(e)}")
        # Fail safe: Mark as failed so we don't retry forever
        doc.reference.update({
            'enrichment.status': 'failed',
            'enrichment.error_log': str(e)
        })

async def main_loop():
    """
    Continuous polling loop. 
    Ideally, this would be a Listen stream or Pub/Sub trigger in production.
    """
    print("Worker Agent Online. Listening for tasks...")
    while True:
        # 1. Query for pending tasks
        docs = db.collection('training_feedback')\
            .where('enrichment.status', '==', 'pending')\
            .limit(10)\
            .stream()

        tasks = []
        for doc in docs:
            tasks.append(process_task(doc))
        
        if tasks:
            await asyncio.gather(*tasks)
        else:
            await asyncio.sleep(2) # Backoff if idle

if __name__ == "__main__":
    asyncio.run(main_loop())
```

---

## 4. Deployment Strategy

### Option A: Cloud Run (Containerized)
1.  **Dockerfile**:
    ```dockerfile
    FROM python:3.10-slim
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install -r requirements.txt
    COPY . .
    CMD ["python", "worker_agent.py"]
    ```
2.  **Deploy**:
    ```bash
    gcloud run deploy dreambees-worker \
        --source . \
        --region us-central1 \
        --env-vars-file .env.yaml
    ```
    *   **Pros**: Scales to zero. Handles high concurrency automatically.
    *   **Cons**: Cold starts (minor issue for background tasks).

### Option B: Cloud Functions (Event-Driven)
*   **Trigger**: Firestore `onCreate` trigger.
*   **Pros**: Instant response. No "Polling" loop needed.
*   **Cons**: Shorter timeout durations (max 9 mins), which is usually fine for VLM inference (~5-10s).

## 5. Monitoring & Alerts

Since this agent runs silently in the background, you **must** implement monitoring.

1.  **Dead Letter Queue**: Query for `enrichment.status == 'failed'`. 
    *   If `count > 10`, send a Slack alert.
2.  **Latency**: Track the time difference between `timestamp` (creation) and `enrichment.processed_at`.
3.  **Cost**: Monitor LMK usage on Vertex AI / OpenAI dashboard.

---

## 6. Security Best Practices
*   **Never commit `service-account.json`**. Use Cloud Secret Manager.
*   **Limit Scope**: The Service Account should only have write access to `training_feedback` and read access to `storage`.
*   **Sanitize Inputs**: Even though `agent_task.input` comes from our backend, treat it as untrusted if passed to `eval()` (which you should never do).
