import React from "react";

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
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-gray-200 ${className ?? ""}`}>
      <div className="flex gap-3">
        {preview.imageUrl && (
          <img
            src={preview.imageUrl}
            alt={preview.title ?? "Link preview"}
            className="h-16 w-24 rounded-lg object-cover border border-white/10"
          />
        )}
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            {preview.siteName ?? new URL(preview.url).hostname}
          </p>
          {preview.title && (
            <p className="font-semibold text-gray-100 line-clamp-2">{preview.title}</p>
          )}
          {preview.description && (
            <p className="text-gray-300 line-clamp-2">{preview.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkPreviewCard;
