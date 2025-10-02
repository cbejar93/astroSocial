import type { FC } from 'react';

const PrivacyPolicyPage: FC = () => {
  return (
    <div className="px-6 py-24 mx-auto max-w-4xl text-left text-white space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Privacy Policy for AstroSocial</h1>
        <p className="text-neutral-300">Effective Date: October 02, 2025</p>
        <p className="text-neutral-300">
          AstroSocial (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides this Privacy Policy to explain how
          we collect, use, share, and safeguard personal information when you use our
          website and related services (collectively, the &ldquo;Services&rdquo;). By accessing or
          using the Services, you acknowledge that you have read and understood this
          Policy.
        </p>
      </header>

      <section className="space-y-6">
        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          <p className="text-neutral-300">
            We collect the following categories of personal information when you use our
            Services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>
              <span className="font-semibold">Account and Contact Details:</span> Name, username,
              email address, and location information.
            </li>
            <li>
              <span className="font-semibold">Social Sign-On Data:</span> When you connect a social
              media or third-party account to sign in, we receive identifiers and basic
              profile details authorized by that provider.
            </li>
            <li>
              <span className="font-semibold">Usage and Device Data:</span> Information about how you
              interact with the Services, including device type, browser, IP address, and
              general analytics data.
            </li>
            <li>
              <span className="font-semibold">Communications:</span> Records of your correspondence with
              us, including support inquiries and marketing preferences.
            </li>
          </ul>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">2. How We Use Personal Information</h2>
          <p className="text-neutral-300">We use personal information for the following purposes:</p>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>
              <span className="font-semibold">Account Creation and Management:</span> To register users,
              authenticate logins (including via social sign-on), and provide customer
              support.
            </li>
            <li>
              <span className="font-semibold">Service Delivery and Personalization:</span> To operate,
              maintain, and improve the Services, including personalization and analytics.
            </li>
            <li>
              <span className="font-semibold">Marketing and Communications:</span> To send service
              updates, newsletters, and promotional messages (where permitted) and to
              manage your communication preferences.
            </li>
            <li>
              <span className="font-semibold">Advertising:</span> To facilitate targeted advertising,
              including by working with advertising partners who may use personal
              information as permitted by law.
            </li>
            <li>
              <span className="font-semibold">Security and Compliance:</span> To detect, prevent, and
              respond to fraud, unauthorized activity, or other security incidents, and to
              comply with legal obligations.
            </li>
          </ul>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">3. How We Share Personal Information</h2>
          <p className="text-neutral-300">We share personal information only as necessary:</p>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>
              <span className="font-semibold">Service Providers:</span> With trusted vendors who process
              data on our behalf (e.g., hosting, analytics, customer support), bound by
              contractual obligations to safeguard information.
            </li>
            <li>
              <span className="font-semibold">Advertising Partners:</span> With advertisers and advertising
              networks to deliver targeted ads and measure campaign performance.
            </li>
            <li>
              <span className="font-semibold">Legal and Safety Obligations:</span> When required by law,
              regulation, legal process, or governmental request, or to protect the
              rights, property, or safety of AstroSocial, our users, or others.
            </li>
            <li>
              <span className="font-semibold">Business Transfers:</span> In connection with mergers,
              acquisitions, financing, or asset sales, subject to appropriate
              confidentiality safeguards.
            </li>
          </ul>
          <p className="text-neutral-300">
            We do not sell personal information for monetary consideration. We may,
            however, share personal information for targeted advertising or
            &ldquo;cross-context behavioral advertising&rdquo; as defined under certain U.S.
            privacy laws. You can opt out of such sharing as described below.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Data Retention</h2>
          <p className="text-neutral-300">
            We retain personal information for as long as your account is active or as
            needed to provide the Services. When you delete or deactivate your account, we
            delete or anonymize your personal information within 30 days, unless longer
            retention is required to comply with legal obligations, resolve disputes, or
            enforce our agreements. Backup copies may persist for a limited period
            consistent with our data retention and disaster recovery practices.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Security</h2>
          <p className="text-neutral-300">
            We implement technical and organizational measures designed to protect
            personal information, including encryption, access controls, and
            authentication safeguards. Despite these measures, no online service can
            guarantee complete security, and you should take care when sharing personal
            information online.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">6. International Users</h2>
          <p className="text-neutral-300">
            We currently make the Services available to users in the EU/UK, the United
            States, Canada, the broader Americas, Japan, South Korea, Australia, and New
            Zealand. Your information may be stored or processed in countries outside your
            jurisdiction (including the United States) where we or our service providers
            operate. When we transfer personal information internationally, we implement
            appropriate safeguards, such as standard contractual clauses or equivalent
            mechanisms, to protect your data.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Your Privacy Rights and Choices</h2>
          <p className="text-neutral-300">
            Depending on your location, you may have the following rights:
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>
              <span className="font-semibold">Access, Correction, and Portability:</span> Request access to
              or a copy of the personal information we hold about you, and ask that we
              correct inaccurate or incomplete information.
            </li>
            <li>
              <span className="font-semibold">Deletion:</span> Request deletion of your personal
              information, subject to legal exceptions.
            </li>
            <li>
              <span className="font-semibold">Objection and Restriction:</span> Object to or request
              restriction of certain processing activities, including targeted advertising.
            </li>
            <li>
              <span className="font-semibold">Opt Out of Marketing:</span> Opt out of marketing emails by
              using the &ldquo;unsubscribe&rdquo; link in those messages or adjusting your account
              preferences.
            </li>
            <li>
              <span className="font-semibold">Opt Out of Targeted Advertising:</span> Contact us using the
              details below or adjust your preferences (where available) to stop sharing
              data with advertising partners for targeted advertising.
            </li>
          </ul>
          <p className="text-neutral-300">
            Residents of the European Union/United Kingdom have additional rights under
            the GDPR, including the right to lodge a complaint with a supervisory
            authority. Residents of California and other U.S. states with comprehensive
            privacy laws may have specific rights to opt out of certain data sharing and to
            request information about our data practices. Canadian residents have rights
            under PIPEDA, including access and correction rights. Users in Japan, South
            Korea, Australia, and New Zealand may have additional rights under applicable
            national or regional privacy laws; we will honor those rights as required.
          </p>
          <p className="text-neutral-300">
            To exercise your rights, please contact us at [insert privacy email/contact
            form]. We may ask you to verify your identity before fulfilling your request.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Children&rsquo;s Privacy</h2>
          <p className="text-neutral-300">
            The Services are not directed to children under the age of 13 (or the age of
            digital consent in your jurisdiction). We do not knowingly collect personal
            information from children. If we learn that we have inadvertently collected
            such information, we will delete it promptly.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Changes to This Policy</h2>
          <p className="text-neutral-300">
            We may update this Privacy Policy from time to time. If we make material
            changes, we will notify you by posting the updated policy on the website and
            updating the &ldquo;Effective Date.&rdquo; Your continued use of the Services after the
            update constitutes acceptance of the revised policy.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Contact Us</h2>
          <p className="text-neutral-300">
            If you have questions or concerns about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Email: [insert privacy contact email]</li>
            <li>Mailing Address: [insert business address]</li>
            <li>Data Protection Officer (if applicable): [insert contact]</li>
          </ul>
        </article>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
