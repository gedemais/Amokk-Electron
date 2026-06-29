const CDN_BASE = 'https://cdn.openai.com/API/docs/audio';
const FALLBACK_URL = `${CDN_BASE}/alloy.wav`;

// Voices available on OpenAI's public CDN
const CDN_VOICES: Record<string, string> = {
  ash: `${CDN_BASE}/ash.wav`,
  nova: `${CDN_BASE}/nova.wav`,
  sage: `${CDN_BASE}/sage.wav`,
};

// Voices bundled locally (generated via tools/generate_voice_sample.py)
const LOCAL_VOICES: Record<string, string> = {
  marin: '/voice-samples/marin.mp3',
};

export function getVoiceSampleUrl(voiceId: string): string {
  return CDN_VOICES[voiceId] ?? LOCAL_VOICES[voiceId] ?? FALLBACK_URL;
}

let currentAudio: HTMLAudioElement | null = null;

function clearCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

export async function toggleVoiceSample(voiceId: string, volume: number): Promise<void> {
  // If already playing — just stop
  if (currentAudio && !currentAudio.paused) {
    clearCurrent();
    return;
  }

  clearCurrent();

  const url = getVoiceSampleUrl(voiceId);
  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume / 100));
  audio.addEventListener('ended', () => { currentAudio = null; });
  currentAudio = audio;

  try {
    await audio.play();
  } catch {
    if (url !== FALLBACK_URL) {
      const fallback = new Audio(FALLBACK_URL);
      fallback.volume = audio.volume;
      fallback.addEventListener('ended', () => { currentAudio = null; });
      currentAudio = fallback;
      await fallback.play();
    }
  }
}
