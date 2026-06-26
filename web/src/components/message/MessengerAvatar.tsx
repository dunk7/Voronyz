"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

function usernameHue(username: string) {
  return username.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
}

export function MessengerAvatar({
  username,
  avatarUrl,
  previewUrl,
  online,
  size = "md",
  isGroup,
  isUpdating = false,
}: {
  username: string;
  avatarUrl?: string | null;
  previewUrl?: string | null;
  online?: boolean;
  size?: "md" | "sm" | "lg";
  isGroup?: boolean;
  isUpdating?: boolean;
}) {
  const letter = username.charAt(0).toUpperCase();
  const hue = usernameHue(username);
  const dimensions =
    size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-14 w-14 text-base" : "h-11 w-11 text-sm";
  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const borderColor = size === "lg" ? "border-[#111113]" : "border-[#0e0e10]";
  const displayUrl = previewUrl ?? avatarUrl ?? null;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [displayUrl]);

  const showImage = Boolean(displayUrl);

  return (
    <div className="relative shrink-0">
      <div
        className={`${dimensions} overflow-hidden rounded-full shadow-inner ring-1 ring-white/10`}
        style={
          showImage
            ? { backgroundColor: "rgba(255,255,255,0.06)" }
            : {
                background: `linear-gradient(135deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 50% 32%))`,
              }
        }
      >
        {showImage && displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={displayUrl}
            src={displayUrl}
            alt=""
            className={`h-full w-full object-cover transition-opacity duration-200 ${
              imageLoaded && !isUpdating ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        ) : isGroup ? (
          <div className="flex h-full w-full items-center justify-center bg-indigo-500/30 text-white">
            <Users className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center font-semibold text-white">
            {letter}
          </div>
        )}
      </div>
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${dotSize} rounded-full border-2 ${borderColor} bg-emerald-400`}
          title="Online"
        />
      )}
    </div>
  );
}

export function GroupAvatarStack({
  members,
}: {
  members: Array<{ username: string; avatarUrl?: string | null }>;
}) {
  const shown = members.slice(0, 2);
  if (shown.length === 0) {
    return <MessengerAvatar username="group" isGroup size="md" />;
  }
  if (shown.length === 1) {
    return (
      <MessengerAvatar
        username={shown[0].username}
        avatarUrl={shown[0].avatarUrl}
        size="md"
      />
    );
  }

  return (
    <div className="relative h-11 w-11 shrink-0">
      <div className="absolute left-0 top-0 scale-[0.72] origin-top-left">
        <MessengerAvatar
          username={shown[0].username}
          avatarUrl={shown[0].avatarUrl}
          size="md"
        />
      </div>
      <div className="absolute bottom-0 right-0 scale-[0.72] origin-bottom-right ring-2 ring-[#0e0e10] rounded-full">
        <MessengerAvatar
          username={shown[1].username}
          avatarUrl={shown[1].avatarUrl}
          size="md"
        />
      </div>
    </div>
  );
}
