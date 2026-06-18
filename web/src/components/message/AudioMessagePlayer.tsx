"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function resolveDuration(audio: HTMLAudioElement): number | null {
  const d = audio.duration;
  if (Number.isFinite(d) && d > 0) return d;
  return null;
}

function probeWebmDuration(audio: HTMLAudioElement): Promise<number | null> {
  return new Promise((resolve) => {
    const existing = resolveDuration(audio);
    if (existing) {
      resolve(existing);
      return;
    }

    const cleanup = () => {
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("loadedmetadata", onMeta);
    };

    const finish = (value: number | null) => {
      cleanup();
      resolve(value);
    };

    const onMeta = () => {
      const d = resolveDuration(audio);
      if (d) finish(d);
    };

    const onSeeked = () => {
      const d = resolveDuration(audio);
      audio.pause();
      audio.currentTime = 0;
      finish(d);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("seeked", onSeeked, { once: true });

    try {
      audio.currentTime = Number.MAX_SAFE_INTEGER;
    } catch {
      finish(null);
    }

    window.setTimeout(() => finish(resolveDuration(audio)), 1500);
  });
}

export function AudioMessagePlayer({
  url,
  isMine,
  durationSeconds,
}: {
  url: string;
  isMine: boolean;
  durationSeconds?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const applyDuration = (value: number | null) => {
      if (cancelled || !value || value <= 0) return;
      setDuration((prev) => (prev > 0 ? prev : value));
    };

    const onTime = () => {
      const total = resolveDuration(audio) ?? durationSeconds ?? duration;
      if (total && total > 0) {
        setCurrentTime(audio.currentTime);
        setProgress(audio.currentTime / total);
        applyDuration(total);
      }
    };

    const onMeta = async () => {
      applyDuration(resolveDuration(audio));
      if (!resolveDuration(audio) && !durationSeconds) {
        const probed = await probeWebmDuration(audio);
        applyDuration(probed);
      }
    };

    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.load();
    void onMeta();

    return () => {
      cancelled = true;
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [url, durationSeconds]);

  const totalDuration =
    duration > 0 ? duration : durationSeconds ?? 0;

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        if (!resolveDuration(audio) && !durationSeconds) {
          const probed = await probeWebmDuration(audio);
          if (probed) setDuration(probed);
        }
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }, [playing, durationSeconds]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const total = resolveDuration(audio) ?? totalDuration;
    if (!audio || !total) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    audio.currentTime = ratio * total;
    setProgress(ratio);
    setCurrentTime(audio.currentTime);
  };

  const timeLabel =
    playing || currentTime > 0
      ? `${formatDuration(currentTime)} / ${formatDuration(totalDuration)}`
      : formatDuration(totalDuration);

  return (
    <div className="flex min-w-[min(100%,14rem)] items-center gap-3 px-3 py-2.5 sm:min-w-[14rem]">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={url} preload="auto" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
          isMine
            ? "bg-white/20 hover:bg-white/30"
            : "bg-white/10 hover:bg-white/15"
        }`}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="ml-0.5 h-4 w-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className={`group relative h-1.5 cursor-pointer rounded-full ${
            isMine ? "bg-white/25" : "bg-white/15"
          }`}
          onClick={seek}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            const total = resolveDuration(audio) ?? totalDuration;
            if (!audio || !total) return;
            if (e.key === "ArrowRight") {
              audio.currentTime = Math.min(total, audio.currentTime + 2);
            }
            if (e.key === "ArrowLeft") {
              audio.currentTime = Math.max(0, audio.currentTime - 2);
            }
          }}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isMine ? "bg-white" : "bg-indigo-400"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p
          className={`mt-1.5 text-[11px] tabular-nums ${
            isMine ? "text-indigo-100" : "text-white/45"
          }`}
        >
          {totalDuration > 0 ? timeLabel : "…"}
        </p>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
