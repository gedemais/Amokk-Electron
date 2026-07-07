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

// Gender of each known TTS voice id, used to resolve `<lang>/<gender>.mp3`
// samples when no per-voice sample is bundled.
const VOICE_GENDERS: Record<string, VoiceGender> = {
  ash: 'male',
  nova: 'female',
  sage: 'female',
  marin: 'female',
};

// Bundled samples live in public/voice-samples/ (populated via
// tools/download_voice_samples.py or tools/generate_voice_samples.py).
// BASE_URL keeps the path valid both on the Vite dev server ("/") and in
// the packaged Electron build loaded over file:// ("./").
const SAMPLES_BASE = `${import.meta.env.BASE_URL}voice-samples`;

/**
 * Ordered candidate URLs for a voice sample, most specific first:
 * 1. per-voice + per-language sample
 * 2. per-gender + per-language sample
 * 3. legacy non-localized CDN sample
 * 4. global fallback
 */
export function getVoiceSampleUrls(voiceId: string, lang?: string): string[] {
  const urls: string[] = [];

  if (lang) {
    urls.push(`${SAMPLES_BASE}/${lang}/${voiceId}.mp3`);
    const gender = VOICE_GENDERS[voiceId];
    if (gender) {
      urls.push(`${SAMPLES_BASE}/${lang}/${gender}.mp3`);
    }
  }
  urls.push(`${SAMPLES_BASE}/${voiceId}.mp3`);
  if (CDN_VOICES[voiceId]) {
    urls.push(CDN_VOICES[voiceId]);
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
export async function toggleVoiceSample(voiceId: string, playback: VoiceSamplePlayback): Promise<void> {
  // If already playing — just stop
  if (currentAudio && !currentAudio.paused) {
    stopCurrent();
    return;
  }

  stopCurrent();

  for (const url of getVoiceSampleUrls(voiceId, playback.lang)) {
    try {
      await playUrl(url, playback);
      return;
    } catch {
      // Sample missing or unplayable — try the next candidate
    }
  }
}
