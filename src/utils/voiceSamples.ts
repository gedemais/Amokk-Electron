export type VoiceGender = 'male' | 'female';

export interface VoiceSamplePlayback {
  volume: number; // 0-100
  speed?: number; // playback rate, e.g. 0.75-2.0
  lang?: string;  // i18n language code, e.g. "fr"
}

const CDN_BASE = 'https://cdn.openai.com/API/docs/audio';
const FALLBACK_URL = `${CDN_BASE}/alloy.wav`;

// Voices available on OpenAI's public CDN (legacy fallback, not localized)
const CDN_VOICES: Record<string, string> = {
  ash: `${CDN_BASE}/ash.wav`,
  nova: `${CDN_BASE}/nova.wav`,
  sage: `${CDN_BASE}/sage.wav`,
};

// Gender of each known TTS voice, used to resolve `<lang>/<gender>.mp3`.
// The production backend exposes exactly two voices per language, named with
// the localized gender ("Homme"/"Femme", "Male"/"Female", ...) — these are
// the primary keys. OpenAI voice ids are kept as a dev/legacy fallback.
// Lookups are case-insensitive (keys must be lowercase).
const VOICE_GENDERS: Record<string, VoiceGender> = {
  // Localized production voice names
  homme: 'male',
  femme: 'female',
  male: 'male',
  female: 'female',
  hombre: 'male',
  mujer: 'female',
  mann: 'male',
  frau: 'female',
  uomo: 'male',
  donna: 'female',
  // OpenAI voice ids (dev/legacy)
  alloy: 'male',
  ash: 'male',
  ballad: 'male',
  cedar: 'male',
  echo: 'male',
  onyx: 'male',
  verse: 'male',
  coral: 'female',
  fable: 'female',
  marin: 'female',
  nova: 'female',
  sage: 'female',
  shimmer: 'female',
};

// Bundled samples live in public/voice-samples/ (populated via
// tools/download_voice_samples.py or tools/generate_voice_samples.py).
// BASE_URL keeps the path valid both on the Vite dev server ("/") and in
// the packaged Electron build loaded over file:// ("./").
const SAMPLES_BASE = `${import.meta.env.BASE_URL}voice-samples`;

/**
 * Ordered candidate URLs for a voice sample, most specific first:
 * 1. per-gender + per-language sample (`<lang>/male.mp3` / `<lang>/female.mp3`)
 * 2. per-voice samples (dev/legacy ids only)
 * 3. gender-consistent CDN sample
 * 4. global fallback
 *
 * `voice` is the voice as reported by the backend — in production the
 * localized gender name ("Femme", "Male", "Donna", ...), in dev an OpenAI
 * voice id ("ash", "marin", ...). Matching is case-insensitive.
 */
export function getVoiceSampleUrls(voice: string, lang?: string): string[] {
  const urls: string[] = [];
  const key = voice.trim().toLowerCase();
  const gender = VOICE_GENDERS[key];

  if (lang && gender) {
    urls.push(`${SAMPLES_BASE}/${lang}/${gender}.mp3`);
  }
  if (lang) {
    urls.push(`${SAMPLES_BASE}/${lang}/${encodeURIComponent(key)}.mp3`);
  }
  urls.push(`${SAMPLES_BASE}/${encodeURIComponent(key)}.mp3`);
  if (CDN_VOICES[key]) {
    urls.push(CDN_VOICES[key]);
  }
  // Keep the CDN fallback gender-consistent so a missing sample never turns
  // a female voice into a male one (or vice versa).
  if (gender === 'female') {
    urls.push(CDN_VOICES.nova);
  } else if (gender === 'male') {
    urls.push(CDN_VOICES.ash);
  }
  urls.push(FALLBACK_URL);

  return [...new Set(urls)];
}

let currentAudio: HTMLAudioElement | null = null;

function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

function playUrl(url: string, { volume, speed = 1 }: VoiceSamplePlayback): Promise<void> {
  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume / 100));
  audio.playbackRate = speed;
  audio.addEventListener('ended', () => {
    if (currentAudio === audio) currentAudio = null;
  });
  currentAudio = audio;
  return audio.play();
}

/**
 * Play the sample matching the selected voice and language, at the given
 * volume and speed. Clicking while a sample is playing stops it.
 */
export async function toggleVoiceSample(voice: string, playback: VoiceSamplePlayback): Promise<void> {
  // If already playing — just stop
  if (currentAudio && !currentAudio.paused) {
    stopCurrent();
    return;
  }

  stopCurrent();

  for (const url of getVoiceSampleUrls(voice, playback.lang)) {
    try {
      await playUrl(url, playback);
      return;
    } catch {
      // Sample missing or unplayable — try the next candidate
    }
  }
}
