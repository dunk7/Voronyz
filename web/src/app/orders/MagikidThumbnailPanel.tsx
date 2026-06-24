"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload } from "lucide-react";

import { MAGIKID_SHOES_THUMBNAIL_URL } from "@/lib/magikidShoesThumbnail";

const THUMB_PATH = MAGIKID_SHOES_THUMBNAIL_URL;

export default function MagikidThumbnailPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/magikid-thumbnail", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      setPreviewKey((k) => k + 1);
      setSuccess(`Thumbnail updated (${Math.round((data.bytes ?? file.size) / 1024)} KB).`);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Magikid Shoes thumbnail
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Shop card and product page hero image for Magikid Shoes.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 cursor-pointer disabled:opacity-50">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : "Replace thumbnail"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </label>
      </div>

      <div className="relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5">
        <Image
          key={previewKey}
          src={`${THUMB_PATH}?v=${previewKey}`}
          alt="Magikid Shoes thumbnail"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 400px"
          unoptimized
        />
      </div>

      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          {success}
        </p>
      ) : null}
    </section>
  );
}
