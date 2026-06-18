"use client";

import { normalizeMimeType } from "@/lib/messageAttachment";
import { useCallback, useRef, useState } from "react";

const MAX_VOICE_SECONDS = 300;
const MIN_VOICE_SECONDS = 0.4;

function pickRecorderMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function extensionForMime(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const mimeRef = useRef("");
  const stopResolveRef = useRef<((file: File | null) => void) | null>(null);
  const stopFnRef = useRef<() => Promise<File | null>>(async () => null);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    secondsRef.current = 0;
    setIsRecording(false);
    setSeconds(0);
  }, []);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    cleanupStream();
    stopResolveRef.current?.(null);
    stopResolveRef.current = null;
  }, [cleanupStream]);

  const stop = useCallback(() => {
    return new Promise<File | null>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      stopResolveRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        cleanupStream();
        resolve(null);
      }
    });
  }, [cleanupStream]);

  stopFnRef.current = stop;

  const start = useCallback(async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    setError(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const message = "Voice recording is not supported in this browser.";
      setError(message);
      return { ok: false, error: message };
    }

    const mimeType = pickRecorderMimeType();
    if (!mimeType) {
      const message = "This browser cannot record audio.";
      setError(message);
      return { ok: false, error: message };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeRef.current = mimeType;
      chunksRef.current = [];
      secondsRef.current = 0;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const elapsed = secondsRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        cleanupStream();

        let file: File | null = null;
        if (blob.size > 0 && elapsed >= MIN_VOICE_SECONDS) {
          const ext = extensionForMime(mimeRef.current);
          file = new File([blob], `voice-message.${ext}`, {
            type: normalizeMimeType(mimeRef.current),
            lastModified: Date.now(),
          });
        }

        stopResolveRef.current?.(file);
        stopResolveRef.current = null;
      };

      recorder.start(200);
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_VOICE_SECONDS) {
          void stopFnRef.current();
        }
      }, 1000);

      return { ok: true as const };
    } catch {
      cleanupStream();
      const message = "Microphone access was denied.";
      setError(message);
      return { ok: false, error: message };
    }
  }, [cleanupStream]);

  return {
    isRecording,
    seconds,
    error,
    start,
    stop,
    cancel,
    setError,
  };
}

export function formatVoiceDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
