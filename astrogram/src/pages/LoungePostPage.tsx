import React, {
  useState,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";
import { UploadCloud } from "lucide-react";

const MAX_IMAGES = 4;

const LoungePostPage: React.FC = () => {
  const { loungeName } = useParams<{ loungeName: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signup', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );

    if (selected.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
      setFiles(selected.slice(0, MAX_IMAGES));
    } else {
      setError(null);
      setFiles(selected);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const plain = body.replace(/<[^>]*>/g, "").trim();
    if (!title.trim() || !plain) {
      setError("Title and body are required");
      return;
    }
    setLoading(true);

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("body", body);
      files.forEach((file) => form.append("images", file));

      const res = await apiFetch(`/lounges/${encodeURIComponent(loungeName ?? '')}/posts`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create post");
      }

      navigate(`/lounge/${encodeURIComponent(loungeName ?? '')}`, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    let sanitized = text;

    if (html) {
      const div = document.createElement("div");
      div.innerHTML = html;
      div.querySelectorAll("[style]").forEach((el) => {
        (el as HTMLElement).style.removeProperty("color");
      });
      div.querySelectorAll("[color]").forEach((el) => {
        el.removeAttribute("color");
      });
      sanitized = div.innerHTML;
    }

    document.execCommand("insertHTML", false, sanitized);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6">
      <h1 className="text-xl font-semibold mb-4">New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-gray-800"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Body</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("bold");
            }}
            className="px-2 py-1 rounded bg-gray-700"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("italic");
            }}
            className="px-2 py-1 rounded bg-gray-700 italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("insertUnorderedList");
            }}
            className="px-2 py-1 rounded bg-gray-700"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("insertOrderedList");
            }}
            className="px-2 py-1 rounded bg-gray-700"
          >
            1.
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="w-full px-3 py-2 rounded bg-gray-800 min-h-[6rem]"
          onInput={() => setBody(editorRef.current?.innerHTML || "")}
          onPaste={handlePaste}
        />
      </div>
        <div>
          <label
            htmlFor="post-images"
            className="
              flex flex-col items-center justify-center
              border-2 border-dashed border-gray-600
              hover:border-teal-400 p-6 rounded-lg
              cursor-pointer bg-gray-700 hover:bg-gray-600
              transition text-gray-200
            "
          >
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-sm">
              {files.length
                ? "Change images"
                : `Click to upload up to ${MAX_IMAGES} images`}
            </span>

            {files.length > 0 && (
              <span className="mt-2 text-xs">{files.length} selected</span>
            )}

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {previews.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`preview-${idx}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <input
              id="post-images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleFiles}
            />
          </label>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-brand hover:bg-brand-dark transition"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default LoungePostPage;
