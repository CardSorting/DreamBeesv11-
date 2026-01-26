# Recurring Character Voice Strategy

To maintain consistent, unique voices for recurring characters (like a specific "Phantom" or "Cat") using Qwen3-TTS, we treat the **Voice Description** as the character's **DNA**.

## The Concept

The **VoiceDesign** model generates a voice entirely based on the text description provided.
- **Input**: "A squeaky, hyper-active robot kitten voice."
- **Output**: A specific sounding voice.

To bring that same character back later, you simply **feed the exact same description string again**. The model "remembers" how to impersonate that character because the instruction is identical.

## Implementation Strategy

Maintain a "Character Bank" (JSON file or database) that maps character IDs to their voice descriptions.

### Example Registry Structure

```json
{
  "phantom_01": {
    "name": "The Phantom",
    "voice_dna": "A deep, resonant, and mysterious voice with a slow pace and slight echo."
  },
  "glitch_cat": {
    "name": "Glitch",
    "voice_dna": "A high-pitched, energetic, and slightly digital-sounding kitten voice."
  },
  "void_entity": {
    "name": "The Void",
    "voice_dna": "A distorted, low-pitch, whispering voice with static undertones."
  }
}
```

## Workflow

1.  **Lookup**: When a character needs to speak, look up their `voice_dna` by their ID.
2.  **Generate**: Send the `voice_dna` to the Modal app's `generate` function as the `voice_description` parameter.
3.  **Result**: The audio will match the established character voice.

## Code Example (Client-Side)

```python
APP_NAME = "phantom-twitch-tts"
tts = modal.Function.lookup(APP_NAME, "QwenTTS.generate")

character_id = "phantom_01"
text = "The shadows are moving again."

# 1. Get DNA
voice_desc = CHARACTER_REGISTRY[character_id]["voice_dna"]

# 2. Generate
audio_bytes = tts.remote(text, voice_description=voice_desc)

# 3. Play/Save Audio
with open(f"{character_id}_output.wav", "wb") as f:
    f.write(audio_bytes)
```
