import React from "react";

type FormMessageProps = {
  tone: "error" | "info";
  text: string;
};

const TONE_STYLES: Record<FormMessageProps["tone"], string> = {
  error:
    "border-rose-200 text-rose-800 dark:border-rose-500/50 dark:text-rose-50 bg-rose-100/70 dark:bg-rose-900/60",
  info:
    "border-amber-200 text-amber-800 dark:border-amber-500/50 dark:text-amber-50 bg-amber-100/70 dark:bg-amber-900/60",
};

export const FormMessage: React.FC<FormMessageProps> = ({ tone, text }) => {
  return (
    <div
      className={`text-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${TONE_STYLES[tone]}`}
      aria-live="polite"
    >
      {text}
    </div>
  );
};

export default FormMessage;
