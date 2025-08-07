import { useState } from "react";

interface LoungePostItemProps {
  title?: string;
  body?: string;
}

const LoungePostItem: React.FC<LoungePostItemProps> = ({ title, body }) => {
  const [open, setOpen] = useState(false);

  const displayTitle = title && title.trim().length > 0 ? title : "Untitled Post";
  const displayBody = body ?? "";

  return (
    <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-md border border-gray-300 dark:border-gray-700 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left font-semibold text-lg text-purple-600 hover:underline"
      >
        {displayTitle}
      </button>
      {open && <div className="mt-2 text-sm whitespace-pre-wrap">{displayBody}</div>}
    </div>
  );
};

export default LoungePostItem;
