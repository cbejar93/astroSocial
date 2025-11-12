// src/components/LoungePostModal.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { apiFetch } from "../lib/api";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

const MAX_IMAGES = 4;
const MAX_TITLE = 120;
const MAX_IMAGE_MB = 10;

type Props = {
  open: boolean;
  onClose: () => void;
  loungeName: string;
  onPosted?: () => Promise<void> | void;
};

const LoungePostModal: React.FC<Props> = ({ open, onClose, loungeName, onPosted }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Reset state each time the modal opens
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBody("");
    setFiles([]);
    setPreviews([]);
    setError(null);
    setLoading(false);
  }, [open]);

  // Generate object URLs for previews
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const remaining = useMemo(() => MAX_IMAGES - files.length, [files.length]);

  const addImages = (incoming: File[]) => {
    const imgs = incoming.filter((f) => f.type.startsWith("image/"));
    const tooBig = imgs.find((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`Images must be ≤ ${MAX_IMAGE_MB}MB each.`);
      return;
    }
    const combined = [...files, ...imgs].slice(0, MAX_IMAGES);
    if (combined.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
    } else {
      setError(null);
    }
    setFiles(combined);
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    addImages(selected);
    e.target.value = "";
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    addImages(Array.from(e.dataTransfer.files ?? []));
  };

  const removeImage = (idx: number) => {
    setFiles((fs) => fs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setError("Title and body are required.");
      return;
    }
    if (trimmedTitle.length > MAX_TITLE) {
      setError(`Title must be ≤ ${MAX_TITLE} characters.`);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("title", trimmedTitle);
      form.append("body", trimmedBody); // backend expects "body"
      files.forEach((file) => form.append("images", file));

      const res = await apiFetch(
        `/lounges/${encodeURIComponent(loungeName)}/posts`,
        { method: "POST", body: form }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create post");
      }

      await onPosted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center overscroll-none"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel (header/footer fixed, content scrolls) */}
      <div className="relative w-[92%] max-w-2xl rounded-2xl border border-white/10 bg-[#0E1626]/95 text-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold tracking-wide">
            Post in {decodeURIComponent(loungeName)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          id="lounge-post-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-5"
        >
          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <div className="relative">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE}
                placeholder="Catchy, specific title…"
                className="w-full rounded-lg bg-gray-900/60 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                {title.trim().length}/{MAX_TITLE}
              </span>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your update..."
              rows={6}
              className="w-full rounded-lg bg-gray-900/60 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Images</label>

            <label
              htmlFor="lounge-post-images"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={[
                "relative flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer",
                "border-2 border-dashed p-6 transition",
                dragOver
                  ? "border-sky-400 bg-sky-950/30"
                  : "border-white/15 bg-white/[0.03] hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <UploadCloud className="w-8 h-8 text-gray-300" />
              <span className="text-sm text-gray-200">
                {files.length ? "Add more images" : `Click or drop up to ${MAX_IMAGES} images`}
              </span>
              <span className="text-[11px] text-gray-400">
                {remaining} slot{remaining === 1 ? "" : "s"} remaining • max {MAX_IMAGE_MB}MB each
              </span>
              <input
                id="lounge-post-images"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFiles}
              />
              <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ring-1 ring-white/10 bg-white/5 text-gray-300">
                <ImageIcon className="w-3.5 h-3.5" />
                {files.length}/{MAX_IMAGES}
              </span>
            </label>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden ring-1 ring-white/10">
                    <img src={src} alt={`preview-${idx}`} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1.5 top-1.5 rounded-full p-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remove image"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error (inside scroll area so it's near fields) */}
          {error && (
            <div className="rounded-lg bg-red-500/10 text-red-200 ring-1 ring-red-400/30 px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer (fixed) */}
        <div className="border-t border-white/10 px-5 py-3 flex items-center gap-3 bg-[#0E1626]/95">
          <button
            type="submit"
            form="lounge-post-form"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 shadow-[0_12px_28px_rgba(15,23,42,0.45)] transition hover:brightness-110 active:translate-y-px disabled:opacity-60"
            style={{ background: "linear-gradient(90deg,#f04bb3,#5aa2ff)" }}
          >
            {loading ? "Posting…" : "Publish Post"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoungePostModal;
