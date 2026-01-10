// src/pages/PrivacyPolicyPage.tsx
import type { FC, PropsWithChildren } from "react";

const PrivacyPolicyPage: FC = () => {
  return (
    <div className="mx-auto w-full max-w-[var(--page-content-max)] [--page-content-max:48rem] px-4 sm:px-6 py-8 sm:py-12 text-white">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10 text-[11px] text-slate-300">
          Privacy Policy
          <span className="h-1 w-1 rounded-full bg-slate-400/70" />
          Effective: <time dateTime="2025-10-02">Oct 02, 2025</time>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Privacy Policy for AstroLounge
        </h1>

        <p className="mt-2 text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300">
          AstroLounge (“we,” “us,” or “our”) provides this Privacy Policy to explain how
          we collect, use, share, and safeguard personal information when you use our
          website and related services (the “Services”). By accessing or using the
          Services, you acknowledge you’ve read and understood this Policy.
        </p>

        {/* Mini TOC */}
        <nav className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { href: "#info", label: "1. Information We Collect" },
            { href: "#use", label: "2. How We Use Information" },
            { href: "#share", label: "3. How We Share Information" },
            { href: "#retention", label: "4. Data Retention" },
            { href: "#security", label: "5. Security" },
            { href: "#intl", label: "6. International Users" },
            { href: "#rights", label: "7. Your Rights & Choices" },
            { href: "#children", label: "8. Children’s Privacy" },
            { href: "#changes", label: "9. Changes to This Policy" },
            { href: "#contact", label: "10. Contact Us" },
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
        <Section id="info" title="1. Information We Collect">
          <P>We collect the following categories of personal information when you use our Services:</P>
          <Ul>
            <Li>
              <b>Account & Contact Details:</b> Name, username, email address, and location information.
            </Li>
            <Li>
              <b>Social Sign-On Data:</b> Identifiers and profile details from providers you authorize.
            </Li>
            <Li>
              <b>Usage & Device Data:</b> Interactions with the Services, device type, browser, IP, and analytics.
            </Li>
            <Li>
              <b>Communications:</b> Support inquiries and marketing preferences.
            </Li>
          </Ul>
        </Section>

        <Section id="use" title="2. How We Use Personal Information">
          <P>We use personal information to:</P>
          <Ul>
            <Li>
              <b>Create & Manage Accounts:</b> Registration, authentication (including social sign-on), and support.
            </Li>
            <Li>
              <b>Deliver & Improve Services:</b> Operate, maintain, personalize, and analyze performance.
            </Li>
            <Li>
              <b>Communicate:</b> Service updates, newsletters, and promotions (where permitted).
            </Li>
            <Li>
              <b>Advertising:</b> Facilitate targeted advertising in compliance with applicable laws.
            </Li>
            <Li>
              <b>Security & Compliance:</b> Detect, prevent, and respond to fraud or security incidents; meet legal obligations.
            </Li>
          </Ul>
        </Section>

        <Section id="share" title="3. How We Share Personal Information">
          <P>We share personal information only as necessary:</P>
          <Ul>
            <Li>
              <b>Service Providers:</b> Hosting, analytics, and support vendors under contractual safeguards.
            </Li>
            <Li>
              <b>Advertising Partners:</b> To deliver targeted ads and measure performance.
            </Li>
            <Li>
              <b>Legal & Safety:</b> As required by law or to protect rights, property, and safety.
            </Li>
            <Li>
              <b>Business Transfers:</b> In mergers, acquisitions, or asset sales with appropriate confidentiality.
            </Li>
          </Ul>
          <P className="mt-2">
            We do not sell personal information for money. We may share data for targeted or
            “cross-context behavioral” advertising under certain U.S. laws. You can opt out as
            described below.
          </P>
        </Section>

        <Section id="retention" title="4. Data Retention">
          <P>
            We retain personal information while your account is active or as needed for the Services. When you
            delete or deactivate your account, we delete or anonymize personal data within 30 days unless longer
            retention is required for legal obligations, dispute resolution, or enforcement. Backup copies may
            persist briefly per our disaster recovery practices.
          </P>
        </Section>

        <Section id="security" title="5. Security">
          <P>
            We implement technical and organizational measures (encryption, access controls, authentication) to
            protect personal information. No online service can guarantee absolute security, so please use care
            when sharing information online.
          </P>
        </Section>

        <Section id="intl" title="6. International Users">
          <P>
            We serve users in the EU/UK, U.S., Canada, the broader Americas, Japan, South Korea, Australia, and
            New Zealand. Your data may be stored or processed outside your jurisdiction (including the U.S.). We
            use appropriate safeguards (e.g., standard contractual clauses) for international transfers.
          </P>
        </Section>

        <Section id="rights" title="7. Your Privacy Rights & Choices">
          <P>Depending on your location, you may have rights to:</P>
          <Ul>
            <Li>
              <b>Access / Correction / Portability:</b> Request access or a copy; ask us to correct inaccuracies.
            </Li>
            <Li>
              <b>Deletion:</b> Request deletion, subject to legal exceptions.
            </Li>
            <Li>
              <b>Objection / Restriction:</b> Object to or restrict certain processing, including targeted ads.
            </Li>
            <Li>
              <b>Marketing Opt-Out:</b> Use the “unsubscribe” link or adjust preferences.
            </Li>
            <Li>
              <b>Targeted Ads Opt-Out:</b> Contact us or use available preference controls.
            </Li>
          </Ul>
          <P className="mt-2">
            EU/UK residents (GDPR) can lodge complaints with a supervisory authority. California and other U.S.
            states may offer specific opt-out rights and disclosures. Canadian residents have access/correction
            rights under PIPEDA. Users in Japan, South Korea, Australia, and New Zealand may have additional rights.
          </P>
          <P className="mt-2">
            To exercise rights, contact us at <i>[insert privacy contact]</i>. We may need to verify your identity.
          </P>
        </Section>

        <Section id="children" title="8. Children’s Privacy">
          <P>
            Our Services are not directed to children under 13 (or the age of digital consent in your region). We
            do not knowingly collect children’s personal information; if we learn we have, we’ll delete it promptly.
          </P>
        </Section>

        <Section id="changes" title="9. Changes to This Policy">
          <P>
            We may update this Policy periodically. Material changes will be posted here and the “Effective Date”
            updated. Your continued use after updates constitutes acceptance.
          </P>
        </Section>

        <Section id="contact" title="10. Contact Us">
          <P>If you have questions about this Policy or our data practices, contact:</P>
          <Ul>
            <Li>Email: <i>[insert privacy contact email]</i></Li>
            <Li>Mailing Address: <i>[insert business address]</i></Li>
            <Li>Data Protection Officer (if applicable): <i>[insert contact]</i></Li>
          </Ul>
        </Section>
      </div>
    </div>
  );
};

/* ---------- Small helpers for consistent styling ---------- */

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

const P: FC<PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <p className={["text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300", className].join(" ")}>
    {children}
  </p>
);

const Ul: FC<PropsWithChildren> = ({ children }) => (
  <ul className="list-disc pl-5 space-y-2 text-[13.5px] sm:text-[14.5px] leading-7 text-slate-300">
    {children}
  </ul>
);

const Li: FC<PropsWithChildren> = ({ children }) => <li>{children}</li>;

export default PrivacyPolicyPage;
