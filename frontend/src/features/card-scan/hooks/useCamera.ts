import { useCallback, useEffect, useRef, useState } from "react";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ready: boolean;
  /** True when the browser has no camera or the user denied access. */
  blocked: boolean;
  retry: () => void;
}

/**
 * Opens the rear camera into a `<video>` element and tears the stream down on
 * unmount (so the OS camera indicator turns off). `blocked` is set when
 * `getUserMedia` is unavailable or rejected — the caller then shows the
 * upload-only fallback.
 */
export function useCamera(active: boolean): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setBlocked(false);
    setReady(false);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    function stop() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setBlocked(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
          setReady(true);
        }
      } catch {
        if (!cancelled) setBlocked(true);
      }
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [active, attempt]);

  return { videoRef, ready, blocked, retry };
}
