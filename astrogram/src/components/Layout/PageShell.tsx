import type { ReactNode } from "react";
import DesktopNav from "../Sidebar/DesktopNav";

interface PageShellProps {
  children: ReactNode;
}

const PageShell = ({ children }: PageShellProps) => (
  <main className="flex-1 md:pl-[calc(var(--desktop-nav-current-width)+var(--desktop-nav-offset))]">
    <div className="mx-auto w-full max-w-[var(--page-content-max)] md:max-w-[calc(var(--page-content-max)+var(--desktop-nav-current-width)+var(--desktop-nav-offset))] px-6 lg:px-8 pt-6 pb-20 md:grid md:grid-cols-[var(--desktop-nav-current-width)_minmax(0,1fr)_16rem] md:gap-8">
      <aside className="hidden md:flex md:w-64 md:flex-col" aria-label="Primary navigation">
        <DesktopNav />
      </aside>

      <section className="w-full min-w-0">{children}</section>

      <aside className="hidden lg:block lg:w-64" aria-hidden="true" />
    </div>
  </main>
);

export default PageShell;
