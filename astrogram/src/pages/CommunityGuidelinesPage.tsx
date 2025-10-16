import type { FC } from 'react';

const CommunityGuidelinesPage: FC = () => {
  return (
    <div className="px-6 py-24 mx-auto max-w-4xl text-left text-white space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Community Guidelines</h1>
        <p className="text-neutral-300 italic">Where the night sky meets community.</p>
        <p className="text-neutral-300">
          Our mission is to create a welcoming, supportive, and professional space for astronomers,
          astrophotographers, and space artists of all levels. By participating, you agree to follow
          these guidelines to keep our community safe, respectful, and inspiring.
        </p>
      </header>

      <section className="space-y-8">
        <article className="space-y-3">
          <h2 className="text-2xl font-semibold">1. Respect &amp; Inclusion</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>This is a space for everyone — amateurs, hardcore scientists, and space-related artists alike.</li>
            <li>Treat all members with respect. No harassment, threats, hate speech, or discrimination of any kind.</li>
            <li>Political discussion is only allowed if directly related to astronomy, space policy, or space science.</li>
          </ul>
        </article>

        <article className="space-y-3">
          <h2 className="text-2xl font-semibold">2. Content Standards</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Posts should be primarily astronomy-related. Off-topic content belongs only in lounges designated for it.</li>
            <li>
              <span className="font-semibold">Original Content:</span> When sharing your own work, include the target, equipment used, and your general location.
            </li>
            <li>
              <span className="font-semibold">Shared Content:</span> If the image isn’t yours, please credit the source when possible.
            </li>
            <li>
              <span className="font-semibold">AI Content:</span> AI-generated art must be clearly labeled, and its use should be limited.
            </li>
            <li>
              <span className="font-semibold">Not Allowed:</span> Nudity, pornography, or pseudoscience (e.g., flat earth theories, UFO abduction claims).
            </li>
          </ul>
        </article>

        <article className="space-y-3">
          <h2 className="text-2xl font-semibold">3. Constructive Participation</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Share constructive feedback and respectful critique — help others improve their craft.</li>
            <li>Troubleshooting and equipment tips are encouraged.</li>
            <li>Scientific debates are welcome, but keep them civil and grounded in evidence.</li>
          </ul>
        </article>

        <article className="space-y-3">
          <h2 className="text-2xl font-semibold">4. Lounges &amp; Discussions</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Lounges exist for focused discussions (e.g., Planetary, DSO, Lunisolar).</li>
            <li>Keep posts relevant to the lounge topic.</li>
            <li>Tiered threads allow for structured conversation — use them respectfully.</li>
          </ul>
        </article>

        <article className="space-y-3">
          <h2 className="text-2xl font-semibold">5. Moderation &amp; Enforcement</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>If you see rule-breaking content, use the report button.</li>
            <li>Offenders will receive a warning first. Repeated violations may result in suspension or removal.</li>
            <li>Moderation is handled by the admin team to ensure consistency and fairness.</li>
          </ul>
        </article>

        <article className="space-y-3">
          <h2 className="text-2xl font-semibold">6. Promotion &amp; Commerce</h2>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Selling gear is not permitted at this time.</li>
            <li>Service promotion (e.g., workshops, events) must be coordinated with the AstroLounge team.</li>
          </ul>
        </article>
      </section>

      <footer className="text-neutral-400">
        <p>Thank you for helping us keep AstroLounge welcoming, safe, and inspiring for everyone.</p>
      </footer>
    </div>
  );
};

export default CommunityGuidelinesPage;

