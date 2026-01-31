# Phantom TTS API Documentation

The Phantom TTS service provides asynchronous text-to-speech generation using the Qwen3-TTS model, optimized for high-performance inference on Modal.

## Base URL
The live API is available at:
`https://mariecoderinc--phantom-twitch-tts-fastapi-app.modal.run`

---

## Endpoints

### 1. Health Check
Check the status of the API service.

- **URL**: `/health`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**: `{"status": "ok", "service": "phantom-twitch-tts"}`

### 2. Submit TTS Job
Submit a new text-to-speech generation request. This is an asynchronous operation.

- **URL**: `/v1/tts`
- **Method**: `POST`
- **Data Params**:
  ```json
  {
    "text": "The text you want to convert to speech.",
    "voice_description": "A crisp, cool, and analytical female voice with a tech-savvy edge and a slight digital, synthesized texture.",
    "language": "English"
  }
  ```
- **Success Response**:
  - **Code**: 202 (Accepted)
  - **Content**:
    ```json
    {
      "job_id": "uuid-v4-string",
      "status": "pending",
      "created_at": 1737834567.89
    }
    ```

### 3. Get Job Status
Retrieve the current status and metadata of a specific job.

- **URL**: `/v1/jobs/{job_id}`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "job_id": "uuid-v4-string",
      "status": "completed",
      "created_at": 1737834567.89,
      "started_at": 1737834570.12,
      "completed_at": 1737834585.34,
      "duration_sec": 12.5,
      "processing_time": 15.22,
      "filename": "uuid-v4-string.wav"
    }
    ```

### 4. Cancel Job
Cancel a pending or processing job.

- **URL**: `/v1/jobs/{job_id}/cancel`
- **Method**: `POST`
- **Success Response**:
  - **Code**: 200
  - **Content**: `{"status": "cancelled"}`

### 5. Download Audio
Download the generated WAV file for a completed job.

- **URL**: `/v1/jobs/{job_id}/audio`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**: Binary WAV file
  - **Headers**: `Content-Disposition: attachment; filename=job_id.wav`

## Voice DNA Registry

The following Voice DNA strings are used for the official project personas and should be used as the `voice_description` parameter.

### 1. Nova (Tech/Cyberpunk)
> "A crisp, cool, and analytical female voice with a tech-savvy edge and a slight digital, synthesized texture. Clear articulation with an efficient, professional tone."

### 2. Luna (Cozy/Celestial)
> "A soft-spoken, warm, and soothing female voice with a gentle, celestial quality. Empathic and calm, with a slow, relaxing pace and a velvety timbre."

### 3. Roxie (Chaos/Punk)
> "A high-energy, loud, and energetic youthful female voice with a punk attitude. Fast-paced and expressive, with a slightly raspier, street-smart tone."

---

## Local Development & CLI

### Installation
Ensure you have the Modal client installed:
```bash
pip install modal
```

### Running Locally (Testing)
Submit a test job to the remote GPU while keeping the local terminal open:
```bash
modal run modal_app.py --text "Hello world" --description "A crisp voice"
```

### Deployment
Deploy the service to Modal:
```bash
modal deploy modal_app.py
```

### Cleanup
The service automatically cleans up jobs and audio files older than 24 hours via scheduled tasks.
