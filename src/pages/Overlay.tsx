/**
 * In-game overlay: a small AMOKK icon pinned near the top-left of the screen,
 * rendered in a transparent click-through Electron window (see
 * electron/main.ts). Four states, driven by GET /get_overlay_state:
 *
 *   thinking  — a message is being processed, nothing audible yet: a ring
 *               orbits the icon
 *   speaking  — a TTS playback is streaming: a flowing waveform under the
 *               icon, its amplitude driven by the ACTUAL loudness of the
 *               audio being played
 *   listening — the user holds push-to-talk: a red recording dot on the icon
 *               and the SAME waveform, in green to tell the two audio
 *               directions apart at a glance, driven by the loudness
 *               actually captured by the microphone
 *   idle      — plain icon
 *
 * Each of the three animations above can be switched off from the
 * Configuration > Overlay In-Game tab; when off, that state simply shows the
 * plain icon instead (the overlay itself still appears/disappears normally).
 *
 * The icon's bounding box (see .overlay-hover-zone in index.css — sized to
 * cover the icon AND the fanned-out menu, not just the icon's own circle),
 * and the chat/volume panel once one is open, are the only parts of this
 * window that are NOT click-through: hovering either flips the native window
 * briefly interactive (see the overlay:set-interactive IPC round-trip
 * below), which for the icon reveals the radial menu (four buttons fanning
 * out from behind it, see .overlay-fan) and makes those buttons clickable.
 * The menu closes the overlay, starts "move" mode (see startOverlayMove in
 * electron/main.ts — the window then follows the cursor until the next
 * left- or right-click drops it), or opens the chat/volume popup below the
 * icon — plain local state, not a separate window, closed again with its own
 * X (only one of the two is ever open at a time).
 *
 * The page background MUST stay fully transparent: anything painted here is
 * painted over the game. Sizes are in CSS px at the design resolution; the
 * main process zooms the whole page to match the screen.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, MessageCircle, Move, Volume2, VolumeX, User, Type } from "lucide-react";
import * as api from "@/lib/api";
import iconUrl from "../../assets/icon.png";

const POLL_MS = 100;          // the level must feel live, not stepped
const CHAT_POLL_MS = 1200;    // text changes far less often than audio levels
const SMOOTHING = 0.45;       // level low-pass, applied on the poll tick

// Chat message text size: user-adjustable (see the header control),
// persisted per-machine in localStorage since it's a plain viewer
// preference with no reason to sync anywhere else.
const CHAT_FONT_SIZE_KEY = "amokk_overlay_chat_font_size";
const CHAT_FONT_SIZE_MIN = 9;
const CHAT_FONT_SIZE_MAX = 16;
const CHAT_FONT_SIZE_DEFAULT = 11;
// How close to the bottom still counts as "following the conversation" (see
// isNearBottomRef below) — a little slack so a near-exact scroll still
// counts, rather than requiring pixel-perfect alignment.
const CHAT_NEAR_BOTTOM_PX = 24;

function loadStoredNumber(key: string, fallback: number, min: number, max: number): number {
  try {
    const raw = Number(localStorage.getItem(key));
    if (Number.isFinite(raw) && raw >= min && raw <= max) return raw;
  } catch {
    // localStorage unavailable (private mode, etc.): just use the default
  }
  return fallback;
}

// Waveform geometry (SVG user units, see the viewBox below).
const WAVE_W = 120;
const WAVE_H = 34;
const WAVE_POINTS = 48;       // enough for a smooth curve, cheap to rebuild
// Half-thickness the ribbon keeps at zero level: silence (or a quiet passage
// mid-sentence) must still read as "audio is flowing", not as a disappearing
// element.
const WAVE_MIN_HALF = 1.4;

type OverlayState = "idle" | "thinking" | "speaking" | "listening";
type ChatRole = "coach" | "question" | "answer";
interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
}

/** window.api is only present under Electron; plain-browser dev preview
 * (and the overlay route loaded outside Electron) must no-op instead of
 * throwing. */
function setOverlayInteractive(interactive: boolean): void {
  (window as any).api?.overlay?.setInteractive?.(interactive);
}

function requestOverlayClose(): void {
  (window as any).api?.overlay?.close?.();
}

function requestOverlayStartMove(): void {
  (window as any).api?.overlay?.startMove?.();
}

/** No-op unless the overlay is currently in "Deplacer" mode (see
 * electron/main.ts startOverlayMove) — clicking the icon is how that mode
 * ends and the new position is dropped. */
function requestOverlayStopMove(): void {
  (window as any).api?.overlay?.stopMove?.();
}

/**
 * A mirrored ribbon whose height follows `level`: two sine components at
 * different speeds keep it organic (a single sine reads as a machine), and an
 * edge envelope tapers both ends so the ribbon closes on itself.
 */
function buildWavePath(level: number, phase: number): string {
  const mid = WAVE_H / 2;
  const amplitude = (WAVE_H / 2 - WAVE_MIN_HALF - 1) * Math.min(1, level);
  const top: string[] = [];
  const bottom: string[] = [];

  for (let i = 0; i < WAVE_POINTS; i++) {
    const t = i / (WAVE_POINTS - 1);
    const x = t * WAVE_W;
    // Taper the ends: sin over [0, PI] is 0 at both edges, 1 in the middle
    const envelope = Math.sin(Math.PI * t) ** 0.8;
    const wave =
      Math.sin(t * 7 + phase) * 0.65 + Math.sin(t * 13 - phase * 1.6) * 0.35;
    // Floor + swell, both tapered: the ribbon never collapses to nothing and
    // still closes cleanly on its two ends.
    const half = (WAVE_MIN_HALF + Math.abs(wave) * amplitude) * envelope;
    top.push(`${x.toFixed(1)},${(mid - half).toFixed(1)}`);
    bottom.push(`${x.toFixed(1)},${(mid + half).toFixed(1)}`);
  }

  return `M${top.join(" L")} L${bottom.reverse().join(" L")} Z`;
}

const Overlay = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<OverlayState>("idle");
  const [speakingAnimEnabled, setSpeakingAnimEnabled] = useState(true);
  const [listeningAnimEnabled, setListeningAnimEnabled] = useState(true);
  const [thinkingAnimEnabled, setThinkingAnimEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatFontSize, setChatFontSize] = useState(() =>
    loadStoredNumber(CHAT_FONT_SIZE_KEY, CHAT_FONT_SIZE_DEFAULT, CHAT_FONT_SIZE_MIN, CHAT_FONT_SIZE_MAX)
  );
  // Whether the user was scrolled to (near) the bottom right before the last
  // messages update — updated continuously from onScroll, not from the
  // messages effect itself, so it always reflects a real user action rather
  // than wherever the scroll happened to land after auto-scrolling.
  const isNearBottomRef = useRef(true);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [volume, setVolume] = useState(50);
  // Last non-zero level, so clicking the speaker to unmute restores whatever
  // it was before rather than jumping to some arbitrary default.
  const lastVolumeRef = useRef(50);

  // The level lives in a ref, never in React state: only the waveform reads
  // it, and it does so from the animation loop — re-rendering the component
  // ten times a second for a value React does not paint would be pure waste.
  // Low-passed on the POLL tick rather than on requestAnimationFrame, which
  // is throttled when the window is occluded.
  const levelRef = useRef(0);
  const wavePathRef = useRef<SVGPathElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  // Poll the backend for state + audio level + the animation settings.
  useEffect(() => {
    let cancelled = false;
    const applyLevel = (target: number) => {
      levelRef.current += (target - levelRef.current) * SMOOTHING;
    };
    const poll = async () => {
      try {
        const data = await api.getOverlayState();
        if (cancelled || !data) return;
        setState((data.state as OverlayState) ?? "idle");
        applyLevel(typeof data.level === "number" ? data.level : 0);
        setSpeakingAnimEnabled(data.speaking_animation_enabled !== false);
        setListeningAnimEnabled(data.listening_animation_enabled !== false);
        setThinkingAnimEnabled(data.thinking_animation_enabled !== false);
        if (typeof data.tts_volume === "number") setVolume(data.tts_volume);
      } catch {
        // backend down: fall back to the plain icon rather than freezing
        if (!cancelled) {
          setState("idle");
          applyLevel(0);
        }
      }
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Chat transcript: only worth polling while the panel is open.
  useEffect(() => {
    if (!chatOpen) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await api.getOverlayChat();
        if (cancelled || !data?.messages) return;
        setMessages(data.messages as ChatMessage[]);
      } catch {
        // backend hiccup: keep showing the last known messages
      }
    };
    poll();
    const id = setInterval(poll, CHAT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [chatOpen]);

  // Re-opening always jumps to (and resumes following) the latest message,
  // regardless of where the user had scrolled before closing the panel.
  useEffect(() => {
    if (chatOpen) isNearBottomRef.current = true;
  }, [chatOpen]);

  // Track how close to the bottom the user actually is, from real scroll
  // events only — this is what the auto-scroll effect below checks before
  // moving anything, so scrolling up to re-read older messages sticks
  // instead of snapping back down on the next poll tick a second later.
  const handleChatScroll = () => {
    const body = chatBodyRef.current;
    if (!body) return;
    const distanceFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
    isNearBottomRef.current = distanceFromBottom < CHAT_NEAR_BOTTOM_PX;
  };

  // Follow new messages only while the user was already at the bottom.
  useEffect(() => {
    if (!chatOpen) return;
    const body = chatBodyRef.current;
    if (body && isNearBottomRef.current) body.scrollTop = body.scrollHeight;
  }, [messages, chatOpen]);

  const applyChatFontSize = (next: number) => {
    const clamped = Math.min(CHAT_FONT_SIZE_MAX, Math.max(CHAT_FONT_SIZE_MIN, next));
    setChatFontSize(clamped);
    try {
      localStorage.setItem(CHAT_FONT_SIZE_KEY, String(clamped));
    } catch {
      // localStorage unavailable: the size just won't survive a restart
    }
  };

  useEffect(() => {
    if (volume > 0) lastVolumeRef.current = volume;
  }, [volume]);

  const applyVolume = (next: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    setVolume(clamped);
    api.updateVolume(clamped);
  };

  const toggleMute = () => {
    applyVolume(volume === 0 ? lastVolumeRef.current || 50 : 0);
  };

  // Only reachable while the popup is open (it's the only place hovering
  // makes the window receive wheel events at all — see .overlay-hover-zone
  // for the same trick on the icon).
  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyVolume(volume + (e.deltaY < 0 ? 5 : -5));
  };

  const handleChatFontSizeWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyChatFontSize(chatFontSize + (e.deltaY < 0 ? 1 : -1));
  };

  const showThinking = state === "thinking" && thinkingAnimEnabled;
  // The waveform serves BOTH audio directions: Amokk speaking (TTS loudness)
  // and the user talking over push-to-talk (mic loudness). Only the palette
  // differs — see .overlay-wave.is-listening.
  const waveActive =
    (state === "speaking" && speakingAnimEnabled) ||
    (state === "listening" && listeningAnimEnabled);
  const showRecDot = state === "listening" && listeningAnimEnabled;

  // Animate the waveform: the phase flows on the frame clock while the
  // amplitude comes from the polled level. The path is written straight to
  // the DOM node — re-rendering React at 60 fps for one attribute is waste.
  useEffect(() => {
    if (!waveActive) return;
    let raf = 0;
    let phase = 0;
    const tick = () => {
      // Louder audio ripples faster: the motion reads as "energy". Kept
      // gentle on purpose — this used to run 2-3x faster and read as jittery
      // rather than alive.
      phase += 0.025 + levelRef.current * 0.09;
      wavePathRef.current?.setAttribute("d", buildWavePath(levelRef.current, phase));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [waveActive]);

  // Faded when idle so it sits quietly in a corner of the screen; kept at
  // full strength while a popup is open so it doesn't look half-vanished
  // right above the conversation/slider the user is looking at (the hover
  // case is handled purely in CSS, see .overlay-stack:has(...)).
  const isIdle = state === "idle" && !chatOpen && !volumeOpen;

  return (
    <div className="overlay-root">
      <div className={`overlay-stack${isIdle ? " is-idle" : ""}`}>
        <div className="overlay-badge-wrap">
          {/* Bounding box around the icon AND the fanned-out menu (see
              index.css for the geometry): hovering anywhere in it reveals
              the menu and keeps it open/interactive, icon or fanned-out
              buttons alike, so crossing the gap to reach a button doesn't
              collapse it. Deliberately generous rather than tight around the
              icon — a bigger target is far more reliable to actually hit. */}
          <div
            className="overlay-hover-zone"
            onMouseEnter={() => setOverlayInteractive(true)}
            onMouseLeave={() => setOverlayInteractive(false)}
          >
            <div
              className="overlay-badge"
              onClick={requestOverlayStopMove}
              onContextMenu={(e) => {
                e.preventDefault();
                requestOverlayStopMove();
              }}
            >
              {showThinking && <span className="overlay-spinner" />}

              <img src={iconUrl} alt="" className="overlay-icon" draggable={false} />

              {/* Recording dot: the universal "you are on the mic" marker */}
              {showRecDot && <span className="overlay-rec-dot" />}
            </div>

            {/* Radial menu: fans out from behind the icon on hover, tucks
                back in the same way on the way out (see .overlay-fan-btn). */}
            <div className="overlay-fan">
              <button type="button" className="overlay-fan-btn" onClick={requestOverlayClose}>
                <X size={16} strokeWidth={2.4} />
                <span className="overlay-fan-tip">{t("pages.Overlay.close_tip")}</span>
              </button>
              <button
                type="button"
                className="overlay-fan-btn"
                onClick={() => {
                  setChatOpen(true);
                  setVolumeOpen(false);
                }}
              >
                <MessageCircle size={16} strokeWidth={2.4} />
                <span className="overlay-fan-tip">{t("pages.Overlay.chat_tip")}</span>
              </button>
              <button type="button" className="overlay-fan-btn" onClick={requestOverlayStartMove}>
                <Move size={16} strokeWidth={2.4} />
                <span className="overlay-fan-tip">{t("pages.Overlay.move_tip")}</span>
              </button>
              <button
                type="button"
                className="overlay-fan-btn"
                onClick={() => {
                  setVolumeOpen(true);
                  setChatOpen(false);
                }}
              >
                {volume === 0 ? (
                  <VolumeX size={16} strokeWidth={2.4} />
                ) : (
                  <Volume2 size={16} strokeWidth={2.4} />
                )}
                <span className="overlay-fan-tip">{t("pages.Overlay.volume_tip")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Waveform, under the icon — cyan for Amokk, green for the user */}
        <div
          className={`overlay-wave ${waveActive ? "is-active" : ""} ${
            state === "listening" ? "is-listening" : ""
          }`}
        >
          <svg
            viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
            className="overlay-wave-svg"
            aria-hidden="true"
          >
            <defs>
              {/* Stops read CSS variables so the palette swaps with the state
                  (see .overlay-wave / .overlay-wave.is-listening) without
                  duplicating the gradient. */}
              <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--wave-edge)" stopOpacity="0.25" />
                <stop offset="50%" stopColor="var(--wave-core)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--wave-edge)" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <path ref={wavePathRef} d={buildWavePath(0, 0)} fill="url(#waveGradient)" />
          </svg>
        </div>
      </div>

      {/* Chat and volume popups: part of this window, not separate ones —
          siblings of .overlay-stack (not inside it) so their 260px width
          doesn't recenter the icon/waveform, which are flush against the
          left edge. Mutually exclusive, see setChatOpen/setVolumeOpen above. */}
      {chatOpen && (
        <div
          className="overlay-popup"
          onMouseEnter={() => setOverlayInteractive(true)}
          onMouseLeave={() => setOverlayInteractive(false)}
        >
          <div className="overlay-popup-header">
            <span className="overlay-popup-title">{t("pages.Overlay.chat_title")}</span>
            <button
              type="button"
              className="overlay-popup-close"
              onClick={() => setChatOpen(false)}
              aria-label={t("pages.Overlay.chat_close_label")}
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>

          {/* Text size, persisted (see CHAT_FONT_SIZE_KEY above). Draggable
              like any slider, but also wheel-adjustable while hovering it —
              see handleChatFontSizeWheel. */}
          <div className="overlay-chat-controls">
            <label className="overlay-chat-control" onWheel={handleChatFontSizeWheel}>
              <Type size={12} strokeWidth={2.2} />
              <input
                type="range"
                className="overlay-mini-slider"
                min={CHAT_FONT_SIZE_MIN}
                max={CHAT_FONT_SIZE_MAX}
                step={1}
                value={chatFontSize}
                onChange={(e) => applyChatFontSize(Number(e.target.value))}
                aria-label={t("pages.Overlay.chat_font_size_label")}
              />
              <span className="overlay-mini-value">{chatFontSize}px</span>
            </label>
          </div>

          <div
            className="overlay-chat-body"
            ref={chatBodyRef}
            onScroll={handleChatScroll}
            style={{ fontSize: chatFontSize }}
          >
            {messages.length === 0 ? (
              <div className="overlay-chat-empty">{t("pages.Overlay.chat_empty")}</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`overlay-chat-row role-${m.role}`}>
                  {/* Avatar: same icon/color for Amokk whether it's
                      answering a question or volunteering coach advice — the
                      role class still exists for that distinction, it just
                      no longer drives the color (see .overlay-chat-bubble in
                      index.css). */}
                  <span className="overlay-chat-avatar">
                    {m.role === "question" ? (
                      <User size={11} strokeWidth={2.4} />
                    ) : (
                      <img src={iconUrl} alt="" />
                    )}
                  </span>
                  <div className={`overlay-chat-bubble role-${m.role}`}>{m.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {volumeOpen && (
        <div
          className="overlay-popup"
          onMouseEnter={() => setOverlayInteractive(true)}
          onMouseLeave={() => setOverlayInteractive(false)}
          onWheel={handleVolumeWheel}
        >
          <div className="overlay-popup-header">
            <span className="overlay-popup-title">{t("pages.Overlay.volume_title")}</span>
            <button
              type="button"
              className="overlay-popup-close"
              onClick={() => setVolumeOpen(false)}
              aria-label={t("pages.Overlay.volume_close_label")}
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>

          <div className="overlay-volume-body">
            <button
              type="button"
              className="overlay-volume-mute"
              onClick={toggleMute}
              aria-label={
                volume === 0
                  ? t("pages.Overlay.volume_unmute_label")
                  : t("pages.Overlay.volume_mute_label")
              }
            >
              {volume === 0 ? (
                <VolumeX size={16} strokeWidth={2.2} />
              ) : (
                <Volume2 size={16} strokeWidth={2.2} />
              )}
            </button>
            <input
              type="range"
              className="overlay-mini-slider"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(e) => applyVolume(Number(e.target.value))}
            />
            <span className="overlay-mini-value">{volume}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overlay;
