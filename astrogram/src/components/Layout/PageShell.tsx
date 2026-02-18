import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

const PageShell = ({ children }: PageShellProps) => (
  <main className="flex-1">
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-[calc(var(--app-header-height)+0.75rem)] sm:pt-[calc(var(--app-header-height)+1.25rem)] pb-20">
      <section className="w-full min-w-0">{children}</section>
    </div>
  </main>
);

export default PageShell;
