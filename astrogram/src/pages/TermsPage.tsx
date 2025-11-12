// src/pages/TermsPage.tsx
import type { FC } from "react";

const TermsPage: FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 text-white">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10 text-[11px] text-slate-300">
          Terms & Conditions
          <span className="h-1 w-1 rounded-full bg-slate-400/70" />
          Last updated: <time>2025-10-30</time>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Terms and Conditions
        </h1>

        <p className="mt-2 text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300">
          Welcome to AstroLounge. These Terms and Conditions govern your use of our
          service. By accessing or using the platform, you agree to abide by these terms.
        </p>

        {/* Mini TOC */}
        <nav className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { href: "#acceptance", label: "1. Acceptance of Terms" },
            { href: "#responsibilities", label: "2. User Responsibilities" },
            { href: "#ownership", label: "3. Content Ownership" },
            { href: "#changes", label: "4. Changes to These Terms" },
          ].map((i) => (
            <a
              key={i.href}
              href={i.href}
              className="rounded-lg bg-white/5 px-3 py-2 text-[12.5px] text-slate-200 ring-1 ring-white/10 hover:bg-white/7 hover:ring-cyan-400/30 transition"
            >
              {i.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Sections */}
      <div className="space-y-4 sm:space-y-5">
        <Section id="acceptance" title="1. Acceptance of Terms">
          By creating an account or otherwise using AstroLounge, you confirm that you
          have read, understood, and agree to be bound by these Terms. If you do not
          agree, you must discontinue use of the service immediately.
        </Section>

        <Section id="responsibilities" title="2. User Responsibilities">
          You are responsible for the content you post and for keeping your account
          secure. Please refrain from sharing content that infringes upon the rights of
          others or violates applicable laws.
        </Section>

        <Section id="ownership" title="3. Content Ownership">
          You retain ownership of the content you create. By posting content on the
          platform, you grant AstroLounge a limited license to display and distribute
          that content in connection with the service.
        </Section>

        <Section id="changes" title="4. Changes to These Terms">
          We may update these Terms from time to time. We will notify you of any
          material changes, and your continued use of AstroLounge after such updates
          constitutes acceptance of the revised Terms.
        </Section>
      </div>

      {/* Footer */}
      <footer className="mt-8 sm:mt-10 border-t border-white/10 pt-4">
        <p className="text-[12.5px] sm:text-[13.5px] leading-6 text-slate-400">
          If you have any questions about these Terms and Conditions, please contact our
          support team.
        </p>
      </footer>
    </div>
  );
};

/* --- Small helper component for consistent card styling --- */
const Section: FC<React.PropsWithChildren<{ id: string; title: string }>> = ({
  id,
  title,
  children,
}) => (
  <section
    id={id}
    className="rounded-2xl bg-[#0B1220]/70 backdrop-blur-md ring-1 ring-white/10 shadow-[0_8px_28px_rgba(2,6,23,0.45)]"
  >
    <div className="px-5 py-3 border-b border-white/10">
      <h2 className="text-[15px] sm:text-base font-semibold">{title}</h2>
      <div className="mt-2 h-[2px] bg-gradient-to-r from-[#f04bb3]/50 via-white/10 to-[#5aa2ff]/50 rounded-full" />
    </div>
    <div className="p-5">
      <p className="text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300">{children}</p>
    </div>
  </section>
);

export default TermsPage;
