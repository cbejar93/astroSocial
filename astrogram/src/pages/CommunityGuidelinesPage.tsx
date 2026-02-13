// src/pages/CommunityGuidelinesPage.tsx
import type { FC, PropsWithChildren } from "react";
import PageContainer from "../components/Layout/PageContainer";

const CommunityGuidelinesPage: FC = () => {
  return (
    <PageContainer size="narrow" className="py-8 sm:py-12 text-white">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10 text-[11px] text-slate-300">
          Community Guidelines
          <span className="h-1 w-1 rounded-full bg-slate-400/70" />
          Last updated: <time>2025-10-30</time>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Community Guidelines
        </h1>

        <p className="mt-2 text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300 italic">
          Where the night sky meets community.
        </p>

        <p className="mt-2 text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300">
          Our mission is to create a welcoming, supportive, and professional space for
          astronomers, astrophotographers, and space artists of all levels. By
          participating, you agree to follow these guidelines to keep our community safe,
          respectful, and inspiring.
        </p>

        {/* Mini TOC */}
        <nav className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { href: "#respect", label: "1. Respect & Inclusion" },
            { href: "#content", label: "2. Content Standards" },
            { href: "#participation", label: "3. Constructive Participation" },
            { href: "#lounges", label: "4. Lounges & Discussions" },
            { href: "#moderation", label: "5. Moderation & Enforcement" },
            { href: "#promotion", label: "6. Promotion & Commerce" },
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
        <Section id="respect" title="1. Respect & Inclusion">
          <Ul>
            <Li>This is a space for everyone — amateurs, scientists, and space-artists alike.</Li>
            <Li>Treat all members with respect. No harassment, threats, hate speech, or discrimination.</Li>
            <Li>Political discussion is allowed only when directly related to astronomy or space policy.</Li>
          </Ul>
        </Section>

        <Section id="content" title="2. Content Standards">
          <Ul>
            <Li>Posts should be primarily astronomy-related. Off-topic goes to lounges designated for it.</Li>
            <Li>
              <b>Original Content:</b> When sharing your work, include target, equipment, and your general location.
            </Li>
            <Li>
              <b>Shared Content:</b> Credit the source when possible.
            </Li>
            <Li>
              <b>AI Content:</b> Clearly label AI-generated work and keep usage limited.
            </Li>
            <Li>
              <b>Not Allowed:</b> Nudity, pornography, or pseudoscience (e.g., flat-earth claims).
            </Li>
          </Ul>
        </Section>

        <Section id="participation" title="3. Constructive Participation">
          <Ul>
            <Li>Offer constructive feedback and respectful critique to help others improve.</Li>
            <Li>Troubleshooting and equipment tips are encouraged.</Li>
            <Li>Scientific debates are welcome — keep them civil and evidence-based.</Li>
          </Ul>
        </Section>

        <Section id="lounges" title="4. Lounges & Discussions">
          <Ul>
            <Li>Lounges exist for focused topics (e.g., Planetary, DSO, Lunisolar).</Li>
            <Li>Keep your posts relevant to the lounge’s focus.</Li>
            <Li>Use tiered threads respectfully to keep conversations structured.</Li>
          </Ul>
        </Section>

        <Section id="moderation" title="5. Moderation & Enforcement">
          <Ul>
            <Li>Use the report button if you see rule-breaking content.</Li>
            <Li>Warnings may precede suspensions; repeated violations may result in removal.</Li>
            <Li>Moderation is handled by the admin team for consistency and fairness.</Li>
          </Ul>
        </Section>

        <Section id="promotion" title="6. Promotion & Commerce">
          <Ul>
            <Li>Selling gear is not permitted at this time.</Li>
            <Li>Service promotion (workshops, events) must be coordinated with the AstroLounge team.</Li>
          </Ul>
        </Section>
      </div>

      {/* Footer */}
      <footer className="mt-8 sm:mt-10 border-t border-white/10 pt-4">
        <p className="text-[12.5px] sm:text-[13.5px] leading-6 text-slate-400">
          Thank you for helping us keep AstroLounge welcoming, safe, and inspiring for everyone.
        </p>
      </footer>
    </PageContainer>
  );
};

/* --- Small helpers for consistent styling --- */

const Section: FC<PropsWithChildren<{ id: string; title: string }>> = ({
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
    <div className="p-5">{children}</div>
  </section>
);

const Ul: FC<PropsWithChildren> = ({ children }) => (
  <ul className="list-disc pl-5 space-y-2 text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300">
    {children}
  </ul>
);

const Li: FC<PropsWithChildren> = ({ children }) => <li>{children}</li>;

export default CommunityGuidelinesPage;
