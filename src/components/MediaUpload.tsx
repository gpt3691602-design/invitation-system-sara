"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const KINDS = {
  image: {
    field: "media_url",
    maxBytes: 10 * 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>,
  },
  video: {
    field: "video_url",
    maxBytes: 50 * 1024 * 1024,
    types: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" } as Record<string, string>,
  },
} as const;

// Uploads straight from the browser to Supabase Storage with the staff
// session (RLS checks staff membership), so a 10MB GIF never passes through
// a server function with a small body limit.
export function MediaUpload({ initialUrl, kind = "image" }: { initialUrl: string | null; kind?: keyof typeof KINDS }) {
  const t = useTranslations(kind === "video" ? "video" : "media");
  const { field, maxBytes, types: TYPES } = KINDS[kind];
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const ext = TYPES[file.type];
    if (!ext) return setError(t("errors.type"));
    if (file.size > maxBytes) return setError(t("errors.size"));

    setStatus("uploading");
    const path = `events/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("event-media")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
    if (uploadError) {
      console.error(uploadError);
      return setError(t("errors.failed"));
    }
    setUrl(supabase.storage.from("event-media").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-900">{t("label")}</span>
      <input type="hidden" name={field} value={url} />
      {url && kind === "video" ? (
        <video src={url} controls playsInline preload="metadata" aria-label={t("previewAlt")} className="max-h-72 rounded-lg border border-gray-200 bg-black" />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file, GIFs must stay animated
        <img src={url} alt={t("previewAlt")} className="max-h-56 rounded-lg border border-gray-200 object-contain" />
      ) : (
        <p className="text-sm text-gray-500">{t("none")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex">
          <span className="sr-only">{t("choose")}</span>
          <input
            ref={inputRef}
            type="file"
            accept={Object.keys(TYPES).join(",")}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
            disabled={status === "uploading"}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={status === "uploading"}
            onClick={() => inputRef.current?.click()}
          >
            {status === "uploading" ? t("uploading") : url ? t("replace") : t("choose")}
          </Button>
        </label>
        {url && (
          <Button type="button" variant="ghost" onClick={() => setUrl("")}>
            {t("remove")}
          </Button>
        )}
      </div>
      <p className="text-sm text-gray-500">{t("hint")}</p>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
