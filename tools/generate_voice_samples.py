"""
One-shot script to generate the TTS voice sample MP3s: one file per voice and
per language, all generated with the same speed setting so the in-app speed
slider is the only thing affecting playback rate.

Run once, then commit the generated files to public/voice-samples/.

Requirements (see tools/requirements.txt):
    pip install -r tools/requirements.txt

Usage:
    OPENAI_API_KEY=sk-... python tools/generate_voice_samples.py

Output:
    public/voice-samples/<lang>/<voice>.mp3
"""

import os
import sys
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Missing dependency: pip install -r tools/requirements.txt")
    sys.exit(1)

# Same speed for every sample: the frontend applies the user's speed setting
# at playback time (audio.playbackRate), so samples must share a baseline.
SAMPLE_SPEED = 1.0

VOICES = ["ash", "nova", "sage", "marin"]

SAMPLE_TEXTS = {
    "fr": "Bienvenue sur Amokk, votre coach IA pour League of Legends.",
    "en": "Welcome to Amokk, your AI coach for League of Legends.",
    "de": "Willkommen bei Amokk, deinem KI-Coach für League of Legends.",
    "es": "Bienvenido a Amokk, tu coach de IA para League of Legends.",
    "it": "Benvenuto su Amokk, il tuo coach IA per League of Legends.",
}

OUT_DIR = Path(__file__).parent.parent / "public" / "voice-samples"


def generate(client: OpenAI, voice: str, lang: str, text: str) -> None:
    out_path = OUT_DIR / lang / f"{voice}.mp3"
    if out_path.exists():
        print(f"[skip] {out_path} already exists")
        return

    print(f"[gen] {lang}/{voice}...")
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        speed=SAMPLE_SPEED,
        response_format="mp3",
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(response.content)
    print(f"[ok]  Saved to {out_path}")


def main() -> None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    for lang, text in SAMPLE_TEXTS.items():
        for voice in VOICES:
            generate(client, voice, lang, text)


if __name__ == "__main__":
    main()
