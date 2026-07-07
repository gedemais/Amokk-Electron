"""
Download the TTS voice sample MP3s from the shared Google Drive folder and
install them into public/voice-samples/, organized as expected by
src/utils/voiceSamples.ts:

    public/voice-samples/<lang>/<voice-or-gender>.mp3

File names in the Drive folder are normalized automatically: any combination
of a language code (fr, en, de, es, it) and a voice id or gender token
(male/female, homme/femme, ash, nova, ...) separated by '_', '-' or '/' is
recognized, e.g. "fr_male.mp3", "ash-en.mp3" or "de/female.mp3".

Requirements (see tools/requirements.txt):
    pip install -r tools/requirements.txt

Usage:
    python tools/download_voice_samples.py

Note: the Drive folder must be shared as "Anyone with the link" for the
download to work without authentication.
"""

import re
import shutil
import sys
import tempfile
from pathlib import Path

try:
    import gdown
except ImportError:
    print("Missing dependency: pip install -r tools/requirements.txt")
    sys.exit(1)

DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/14a02O7rub44E3TycI5ze1zl2esS1ydMi"
OUT_DIR = Path(__file__).parent.parent / "public" / "voice-samples"

LANGUAGES = {"fr", "en", "de", "es", "it"}
GENDER_ALIASES = {
    "male": "male",
    "homme": "male",
    "m": "male",
    "female": "female",
    "femme": "female",
    "f": "female",
}


def normalized_target(mp3_path: Path, download_root: Path) -> Path:
    """Map a downloaded mp3 to its public/voice-samples/ destination."""
    relative = mp3_path.relative_to(download_root)
    tokens = re.split(r"[_\-\s/\\]+", str(relative.with_suffix("")).lower())

    lang = next((t for t in tokens if t in LANGUAGES), None)
    voice = next(
        (GENDER_ALIASES.get(t, t) for t in tokens if t not in LANGUAGES),
        None,
    )

    if lang and voice:
        return OUT_DIR / lang / f"{voice}.mp3"
    # Unrecognized name: keep it flat so it can still be used as
    # a non-localized per-voice sample.
    return OUT_DIR / relative.name.lower()


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="amokk-voice-samples-") as tmp:
        download_root = Path(tmp)
        print(f"[dl] Downloading folder {DRIVE_FOLDER_URL}")
        try:
            result = gdown.download_folder(
                url=DRIVE_FOLDER_URL,
                output=str(download_root),
                quiet=False,
            )
        except Exception as error:
            result = None
            print(f"\n{error}")
        if not result:
            print(
                "\nError: could not retrieve the Drive folder. Make sure it is "
                "shared as 'Anyone with the link', or download the files "
                "manually into public/voice-samples/<lang>/<voice>.mp3."
            )
            sys.exit(1)

        mp3_files = sorted(download_root.rglob("*.mp3"))
        if not mp3_files:
            print("Error: no .mp3 files found in the Drive folder.")
            sys.exit(1)

        for mp3 in mp3_files:
            target = normalized_target(mp3, download_root)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(mp3, target)
            print(f"[ok] {mp3.name} -> {target.relative_to(OUT_DIR.parent.parent)}")

    print(f"\nDone. {len(mp3_files)} sample(s) installed in {OUT_DIR}")


if __name__ == "__main__":
    main()
