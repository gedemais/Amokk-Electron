/**
 * In-game overlay: a small AMOKK icon pinned to the top-left of the screen,
 * rendered in a transparent click-through Electron window (see
 * electron/main.ts). Four states, driven by GET /get_overlay_state:
 *
 *   thinking  — a message is being processed, nothing audible yet: a ring
 *               orbits the icon
 *   speaking  — a TTS playback is streaming: a flowing waveform under the
 *               icon, its amplitude driven by the ACTUAL loudness of the
 *               audio being played
 *   listening — the user holds push-to-talk: a red recording dot on the icon
 *               and the SAME waveform, in red/orange to tell the two audio
 *               directions apart at a glance, driven by the loudness
 *               actually captured by the microphone
 *   idle      — plain icon
 *
 * Each of the three animations above can be switched off from the
 * Configuration > Overlay In-Game tab; when off, that state simply shows the
 * plain icon instead (the overlay itself still appears/disappears normally).
 *
 * An optional live chat panel (also toggled from that tab) shows the recent
 * conversation — the user's questions, AMOKK's answers, and unprompted coach
 * advice — each color-coded by role. It is the one part of this window that
 * is NOT click-through: hovering it flips the native window briefly
 * interactive (see the overlay:set-interactive IPC round-trip below) so the
 * fold button and scrolling work, then hands control back to the game the
 * moment the cursor leaves.
 *
 * The page background MUST stay fully transparent: anything painted here is
 * painted over the game. Sizes are in CSS px at the design resolution; the
 * main process zooms the whole page to match the screen.
 */
import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import * as api from "@/lib/api";
import iconUrl from "../../assets/icon.png";

const POLL_MS = 100;          // the level must feel live, not stepped
const CHAT_POLL_MS = 1200;    // text changes far less often than audio levels
const SMOOTHING = 0.45;       // level low-pass, applied on the poll tick

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
  const [state, setState] = useState<OverlayState>("idle");
  const [speakingAnimEnabled, setSpeakingAnimEnabled] = useState(true);
  const [listeningAnimEnabled, setListeningAnimEnabled] = useState(true);
  const [thinkingAnimEnabled, setThinkingAnimEnabled] = useState(true);
  const [liveChatEnabled, setLiveChatEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Starts folded: the panel should never cover the game with unread text
  // right as the setting comes on. Re-folded every time the setting goes
  // from off to on again (see the effect below) — a manual unfold only
  // lasts for that one activation.
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const wasLiveChatEnabledRef = useRef(false);

  // The level lives in a ref, never in React state: only the waveform reads
  // it, and it does so from the animation loop — re-rendering the component
  // ten times a second for a value React does not paint would be pure waste.
  // Low-passed on the POLL tick rather than on requestAnimationFrame, which
  // is throttled when the window is occluded.
  const levelRef = useRef(0);
  const wavePathRef = useRef<SVGPathElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  // Poll the backend for state + audio level + the animation/chat settings.
  // The settings rarely change, but riding the same 100ms poll keeps them in
  // sync without a second request every tick.
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
        setLiveChatEnabled(data.live_chat_enabled === true);
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

  // Chat transcript: only worth polling while the setting is on.
  useEffect(() => {
    if (!liveChatEnabled) {
      setMessages([]);
      return;
    }
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
  }, [liveChatEnabled]);

  // Re-fold on every off -> on transition of the "Live Textual Chat" setting
  // (including the very first poll response, since wasLiveChatEnabledRef
  // starts false): whatever the user left it at during a previous
  // activation, a fresh activation always starts folded.
  useEffect(() => {
    if (liveChatEnabled && !wasLiveChatEnabledRef.current) {
      setChatCollapsed(true);
    }
    wasLiveChatEnabledRef.current = liveChatEnabled;
  }, [liveChatEnabled]);

  // Auto-scroll to the newest message, unless the panel is folded.
  useEffect(() => {
    if (chatCollapsed) return;
    const body = chatBodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [messages, chatCollapsed]);

  const toggleChatCollapsed = () => setChatCollapsed((prev) => !prev);

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
      // Louder audio ripples faster: the motion reads as "energy"
      phase += 0.06 + levelRef.current * 0.22;
      wavePathRef.current?.setAttribute("d", buildWavePath(levelRef.current, phase));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [waveActive]);

  return (
    <div className="overlay-root">
      <div className="overlay-stack">
        <div className="overlay-badge">
          {showThinking && <span className="overlay-spinner" />}

          <img src={iconUrl} alt="" className="overlay-icon" draggable={false} />

          {/* Recording dot: the universal "you are on the mic" marker */}
          {showRecDot && <span className="overlay-rec-dot" />}
        </div>

        {/* Waveform, under the icon — cyan for Amokk, red for the user */}
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

      {liveChatEnabled && (
        <div
          className="overlay-chat"
          onMouseEnter={() => setOverlayInteractive(true)}
          onMouseLeave={() => setOverlayInteractive(false)}
        >
          <button
            type="button"
            className={`overlay-chat-toggle ${chatCollapsed ? "" : "is-expanded"}`}
            onClick={toggleChatCollapsed}
            aria-label="Afficher la conversation"
          >
            <MessageCircle strokeWidth={2.2} />
          </button>

          {!chatCollapsed && (
            <div className="overlay-chat-body" ref={chatBodyRef}>
              {messages.length === 0 ? (
                <div className="overlay-chat-empty">En attente de conversation...</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`overlay-chat-bubble role-${m.role}`}>
                    {m.text}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Overlay;
