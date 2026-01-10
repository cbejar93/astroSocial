import React from "react";

type PageShellProps = {
  children: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

const PageShell: React.FC<PageShellProps> = ({
  children,
  left,
  right,
  className = "",
  contentClassName = "",
}) => (
  <div
    className={[
      "mx-auto w-full max-w-7xl md:max-w-[calc(var(--content-max-width)+var(--desktop-nav-current-width)+var(--desktop-nav-offset))]",
      "px-6 lg:px-8 pt-6 pb-20 md:grid md:grid-cols-[var(--desktop-nav-current-width)_minmax(0,1fr)_16rem] md:gap-8",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <aside className="hidden md:flex md:w-64 md:flex-col" aria-label="Primary navigation">
      {left}
    </aside>

    <section className={["w-full min-w-0", contentClassName].filter(Boolean).join(" ")}>
      {children}
    </section>

    <aside className="hidden lg:block lg:w-64" aria-hidden="true">
      {right}
    </aside>
  </div>
);

export default PageShell;
