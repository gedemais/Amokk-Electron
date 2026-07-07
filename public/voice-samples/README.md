# TTS voice samples

MP3 samples played by the "Test Volume" button, one per voice and per
language, all generated with the same speed setting (the app applies the
user's speed setting at playback time).

Expected layout:

```
public/voice-samples/
  fr/ash.mp3      # per-voice, per-language sample
  fr/female.mp3   # per-gender fallback for a language
  en/ash.mp3
  ...
  ash.mp3         # non-localized per-voice fallback
```

Resolution order (see `src/utils/voiceSamples.ts`):

1. `<lang>/<voiceId>.mp3`
2. `<lang>/<gender>.mp3`
3. `<voiceId>.mp3`
4. OpenAI CDN sample, then global fallback

To populate this folder:

- `python tools/download_voice_samples.py` — downloads and normalizes the
  MP3s from the shared Google Drive folder (it must be shared as
  "Anyone with the link").
- `python tools/generate_voice_samples.py` — regenerates the samples with
  the OpenAI TTS API (`OPENAI_API_KEY` required).
