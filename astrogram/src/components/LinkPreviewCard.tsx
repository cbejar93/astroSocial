import React, { useState } from "react";

type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
};

type LinkPreviewCardProps = {
  preview: LinkPreview;
  className?: string;
};

const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ preview, className }) => {
  const [imgError, setImgError] = useState(false);

  let hostname = "";
  try {
    hostname = new URL(preview.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = preview.url;
  }

  const displaySite = preview.siteName ?? hostname;
  const showImage = preview.imageUrl && !imgError;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden hover:bg-white/[0.07] transition-colors ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {showImage && (
        <div className="w-full bg-black/20">
          <img
            src={preview.imageUrl}
            alt={preview.title ?? "Link preview"}
            className="w-full max-h-72 object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      <div className="px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">
          {displaySite}
        </p>
        {preview.title && (
          <p className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
};

export default LinkPreviewCard;
