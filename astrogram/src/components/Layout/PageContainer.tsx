import type { ReactNode } from "react";

const MAX_WIDTH = {
  narrow: "48rem",
  standard: "72rem",
  wide: "80rem",
  form: "32rem",
} as const;

interface PageContainerProps {
  children: ReactNode;
  size?: "narrow" | "standard" | "wide" | "form" | "full";
  className?: string;
}

const PageContainer = ({
  children,
  size = "standard",
  className = "",
}: PageContainerProps) => {
  if (size === "full") {
    return (
      <div className={`w-full px-4 sm:px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    );
  }

  const maxW = MAX_WIDTH[size];

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      style={{ maxWidth: maxW }}
    >
      {children}
    </div>
  );
};

export default PageContainer;
