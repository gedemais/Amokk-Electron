import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";

const MIC_LEVEL_POLL_MS = 100;

/**
 * Discord-like mic test: polls the backend level while active. Shared
 * between the Configuration dialog and the first-launch onboarding wizard,
 * each of which passes its own `open` flag so the test stops when either
 * one closes.
 */
export const useMicTest = (open: boolean, selectedInputDevice: string) => {
  const [micTestActive, setMicTestActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micPollRef = useRef<NodeJS.Timeout | null>(null);

  const stopMicTest = useCallback(() => {
    if (micPollRef.current) {
      clearInterval(micPollRef.current);
      micPollRef.current = null;
    }
    setMicTestActive(false);
    setMicLevel(0);
    // Best-effort: the backend watchdog closes the stream anyway when the
    // polling stops (killed renderer, backend restart...).
    api.stopMicTest().catch(() => {});
  }, []);

  const startMicTest = async () => {
    try {
      const data = await api.startMicTest(selectedInputDevice);
      // apiRequest never throws on 4xx/5xx: gate on the payload instead.
      if (data?.active !== true) return;
      setMicTestActive(true);
      micPollRef.current = setInterval(async () => {
        try {
          const level = await api.getMicLevel();
          if (level?.active !== true) {
            stopMicTest(); // watchdog fired or device unplugged mid-test
            return;
          }
          setMicLevel(level.level ?? 0);
        } catch {
          stopMicTest(); // backend unreachable
        }
      }, MIC_LEVEL_POLL_MS);
    } catch {
      // backend down: leave the test idle
    }
  };

  // Stop when the host dialog/wizard closes, and on unmount.
  useEffect(() => {
    if (!open && micTestActive) stopMicTest();
  }, [open, micTestActive, stopMicTest]);
  useEffect(() => () => stopMicTest(), [stopMicTest]);

  // Switching device mid-test: the backend restarts its stream in place.
  useEffect(() => {
    if (micTestActive) {
      api.startMicTest(selectedInputDevice).catch(() => stopMicTest());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInputDevice]);

  return { micTestActive, micLevel, startMicTest, stopMicTest };
};
