"""
One-shot script to generate the TTS voice sample for voices not available on OpenAI's CDN.
Run once, then commit the generated file to public/voice-samples/.

Usage:
    OPENAI_API_KEY=sk-... python tools/generate_voice_sample.py

Output:
    public/voice-samples/marin.mp3
"""

import os
import sys
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Missing dependency: pip install openai")
    sys.exit(1)

SAMPLE_TEXT = "Bienvenue sur Amokk, votre coach IA pour League of Legends."
VOICES_TO_GENERATE = ["marin"]
OUT_DIR = Path(__file__).parent.parent / "public" / "voice-samples"


def generate(client: OpenAI, voice: str) -> None:
    out_path = OUT_DIR / f"{voice}.mp3"
    if out_path.exists():
        print(f"[skip] {out_path} already exists")
        return

    print(f"[gen] Generating sample for voice '{voice}'...")
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=SAMPLE_TEXT,
        response_format="mp3",
    )
    out_path.write_bytes(response.content)
    print(f"[ok]  Saved to {out_path}")


def main() -> None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = OpenAI(api_key=api_key)

    for voice in VOICES_TO_GENERATE:
        generate(client, voice)


if __name__ == "__main__":
    main()
