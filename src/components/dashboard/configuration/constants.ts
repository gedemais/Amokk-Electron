// Radix SelectItem forbids value="" — this sentinel stands for the system
// default device; the backend only ever sees "".
export const DEFAULT_DEVICE_SENTINEL = "__default__";

export const TTS_SPEED_MIN = 0.75;
export const TTS_SPEED_MAX = 2.0;
export const TTS_SPEED_STEP = 0.05;
