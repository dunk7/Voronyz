"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioMessagePlayer({
  url,
  isMine,
}: {
  url: string;
  isMine: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [url]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  };

  return (
    <div className="flex min-w-[min(100%,14rem)] items-center gap-3 px-3 py-2.5 sm:min-w-[14rem]">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
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
            if (!audio?.duration) return;
            if (e.key === "ArrowRight") {
              audio.currentTime = Math.min(audio.duration, audio.currentTime + 2);
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
          {formatDuration(
            playing || progress > 0
              ? progress * (duration || 0)
              : duration || 0
          )}
        </p>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
