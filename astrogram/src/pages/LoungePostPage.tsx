// import React, {
//   useState,
//   type ChangeEvent,
//   type DragEvent,
//   type FormEvent,
//   useEffect,
//   useMemo,
// } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";
// import { apiFetch } from "../lib/api";
// import { UploadCloud, X, Image as ImageIcon } from "lucide-react";
// import ReactQuill from "react-quill-new";
// import "../styles/react-quill-new.css";

// const MAX_IMAGES = 4;
// const MAX_TITLE = 120;
// const MAX_IMAGE_MB = 10;

// /* ---------- Tiny UI helpers ---------- */

// const AuroraBorder: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
//   className = "",
//   children,
// }) => (
//   <div
//     className={[
//       "rounded-2xl p-[1px]",
//       "bg-[conic-gradient(at_20%_0%,rgba(240,75,179,.25),rgba(90,162,255,.25),rgba(34,197,94,.18),rgba(240,75,179,.25))]",
//       className,
//     ].join(" ")}
//   >
//     <div className="rounded-2xl bg-[#0E1626]/80 ring-1 ring-white/10 backdrop-blur-md shadow-[0_16px_60px_rgba(2,6,23,.55)]">
//       {children}
//     </div>
//   </div>
// );

// const GradientButton: React.FC<
//   React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
// > = ({ loading, className = "", children, ...props }) => (
//   <button
//     {...props}
//     disabled={loading || props.disabled}
//     className={[
//       "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white",
//       "ring-1 ring-white/20 shadow-[0_12px_28px_rgba(15,23,42,0.45)] transition hover:brightness-110 active:translate-y-px",
//       "disabled:opacity-60",
//       className,
//     ].join(" ")}
//     style={{ background: "linear-gradient(90deg,#f04bb3,#5aa2ff)" }}
//   >
//     {loading ? "Posting…" : children}
//   </button>
// );

// /* ------------------------------------ */

// const LoungePostPage: React.FC = () => {
//   const { loungeName } = useParams<{ loungeName: string }>();
//   const navigate = useNavigate();
//   const { user, loading: authLoading } = useAuth();

//   const [title, setTitle] = useState("");
//   const [body, setBody] = useState("");
//   const [files, setFiles] = useState<File[]>([]);
//   const [previews, setPreviews] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [dragOver, setDragOver] = useState(false);

//   const toolbarModules = useMemo(
//     () => ({
//       toolbar: [
//         ["bold", "italic", "underline"],
//         [{ list: "ordered" }, { list: "bullet" }],
//         ["link"],
//       ],
//     }),
//     []
//   );

//   useEffect(() => {
//     if (!authLoading && !user) navigate("/signup", { replace: true });
//   }, [authLoading, user, navigate]);

//   useEffect(() => {
//     const urls = files.map((f) => URL.createObjectURL(f));
//     setPreviews(urls);
//     return () => urls.forEach((u) => URL.revokeObjectURL(u));
//   }, [files]);

//   const addImages = (incoming: File[]) => {
//     const imgs = incoming.filter((f) => f.type.startsWith("image/"));
//     const tooBig = imgs.find((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
//     if (tooBig) {
//       setError(`Images must be ≤ ${MAX_IMAGE_MB}MB each.`);
//       return;
//     }
//     const combined = [...files, ...imgs].slice(0, MAX_IMAGES);
//     if (combined.length > MAX_IMAGES) {
//       setError(`You can upload up to ${MAX_IMAGES} images.`);
//     } else {
//       setError(null);
//     }
//     setFiles(combined);
//   };

//   const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
//     const selected = Array.from(e.target.files ?? []);
//     addImages(selected);
//     e.target.value = "";
//   };

//   const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setDragOver(true);
//   };
//   const onDragLeave = () => setDragOver(false);
//   const onDrop = (e: DragEvent<HTMLLabelElement>) => {
//     e.preventDefault();
//     setDragOver(false);
//     addImages(Array.from(e.dataTransfer.files ?? []));
//   };

//   const removeImage = (idx: number) => {
//     setFiles((fs) => fs.filter((_, i) => i !== idx));
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (loading) return;
//     setError(null);
//     const plain = body.replace(/<[^>]*>/g, "").trim();

//     if (!title.trim() || !plain) {
//       setError("Title and body are required.");
//       return;
//     }
//     if (title.trim().length > MAX_TITLE) {
//       setError(`Title must be ≤ ${MAX_TITLE} characters.`);
//       return;
//     }

//     setLoading(true);
//     try {
//       const form = new FormData();
//       form.append("title", title.trim());
//       form.append("body", body);
//       files.forEach((file) => form.append("images", file));

//       const res = await apiFetch(
//         `/lounges/${encodeURIComponent(loungeName ?? "")}/posts`,
//         { method: "POST", body: form }
//       );
//       if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         throw new Error(text || "Failed to create post");
//       }
//       navigate(`/lounge/${encodeURIComponent(loungeName ?? "")}`, { replace: true });
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const titleCount = title.trim().length;
//   const remaining = MAX_IMAGES - files.length;

//   return (
//     <div className="w-full py-8 lg:pl-64 flex justify-center">
//       <div className="w-full max-w-3xl px-0 sm:px-4">
//         {/* Header */}
//         <AuroraBorder>
//           <div className="px-5 py-4 flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div
//                 className="h-7 rounded-full px-3 text-xs font-medium inline-flex items-center ring-1 ring-white/10 text-white"
//                 style={{ background: "linear-gradient(90deg,#f04bb3,#5aa2ff)" }}
//               >
//                 {loungeName ? decodeURIComponent(loungeName) : "Lounge"}
//               </div>
//               <h1 className="text-lg font-semibold">Create a new post</h1>
//             </div>
//             <button
//               type="button"
//               onClick={() =>
//                 navigate(`/lounge/${encodeURIComponent(loungeName ?? "")}`)
//               }
//               className="text-xs rounded-md px-3 py-1.5 bg-white/5 hover:bg-white/10 ring-1 ring-white/10"
//             >
//               Cancel
//             </button>
//           </div>
//         </AuroraBorder>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="mt-6 space-y-6">
//           {/* Title */}
//           <AuroraBorder>
//             <div className="p-5">
//               <label htmlFor="post-title" className="block text-xs text-gray-400 mb-1.5">
//                 Title
//               </label>
//               <div className="relative">
//                 <input
//                   id="post-title"
//                   type="text"
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   maxLength={MAX_TITLE}
//                   placeholder="Catchy, specific title…"
//                   className={[
//                     "w-full rounded-lg bg-gray-900/60 border border-white/10",
//                     "text-gray-100 placeholder-gray-400",
//                     "focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm",
//                   ].join(" ")}
//                 />
//                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
//                   {titleCount}/{MAX_TITLE}
//                 </span>
//               </div>
//             </div>
//           </AuroraBorder>

//           {/* Body */}
//           <AuroraBorder>
//             <div className="p-5">
//               <label className="block text-xs text-gray-400 mb-1.5">Body</label>
//               <div className="rounded-lg overflow-hidden ring-1 ring-white/10">
//                 <ReactQuill
//                   value={body}
//                   onChange={(html) => setBody(html)}
//                   modules={toolbarModules}
//                   placeholder="Share your update..."
//                   className="bg-[#0B1220]"
//                 />
//               </div>
//               <p className="mt-2 text-[11px] text-gray-400">
//                 Tip: include equipment, target, and conditions for best feedback.
//               </p>
//             </div>
//           </AuroraBorder>

//           {/* Images */}
//           <AuroraBorder>
//             <div className="p-5">
//               <label className="block text-xs text-gray-400 mb-2">Images</label>

//               <label
//                 htmlFor="post-images"
//                 onDragOver={onDragOver}
//                 onDragLeave={onDragLeave}
//                 onDrop={onDrop}
//                 className={[
//                   "relative flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer",
//                   "border-2 border-dashed p-6 transition",
//                   dragOver
//                     ? "border-sky-400 bg-sky-950/30"
//                     : "border-white/15 bg-white/[0.03] hover:bg-white/[0.06]",
//                 ].join(" ")}
//               >
//                 <UploadCloud className="w-8 h-8 text-gray-300" />
//                 <span className="text-sm text-gray-200">
//                   {files.length ? "Add more images" : `Click or drop up to ${MAX_IMAGES} images`}
//                 </span>
//                 <span className="text-[11px] text-gray-400">
//                   {remaining} slot{remaining === 1 ? "" : "s"} remaining • max {MAX_IMAGE_MB}MB each
//                 </span>
//                 <input
//                   id="post-images"
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   className="sr-only"
//                   onChange={handleFiles}
//                 />

//                 {/* subtle corner badge */}
//                 <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ring-1 ring-white/10 bg-white/5 text-gray-300">
//                   <ImageIcon className="w-3.5 h-3.5" />
//                   {files.length}/{MAX_IMAGES}
//                 </span>
//               </label>

//               {previews.length > 0 && (
//                 <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
//                   {previews.map((src, idx) => (
//                     <div key={idx} className="relative group rounded-xl overflow-hidden ring-1 ring-white/10">
//                       <img
//                         src={src}
//                         alt={`preview-${idx}`}
//                         className="w-full h-28 object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => removeImage(idx)}
//                         className="absolute right-1.5 top-1.5 rounded-full p-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
//                         aria-label="Remove image"
//                         title="Remove"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </AuroraBorder>

//           {/* Error + Actions */}
//           {error && (
//             <div className="rounded-lg bg-red-500/10 text-red-200 ring-1 ring-red-400/30 px-3 py-2 text-sm">
//               {error}
//             </div>
//           )}

//           <div className="flex items-center gap-3">
//             <GradientButton type="submit" loading={loading}>
//               Publish Post
//             </GradientButton>
//             <button
//               type="button"
//               onClick={() =>
//                 navigate(`/lounge/${encodeURIComponent(loungeName ?? "")}`)
//               }
//               className="rounded-lg px-4 py-2 text-sm text-gray-200 ring-1 ring-white/10 hover:bg-white/10"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default LoungePostPage;
