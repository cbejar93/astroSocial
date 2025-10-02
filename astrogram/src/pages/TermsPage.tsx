import type { FC } from 'react';

const TermsPage: FC = () => {
  return (
    <div className="px-6 py-24 mx-auto max-w-4xl text-left text-white space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-neutral-300">
          Welcome to AstroLounge. These Terms and Conditions govern your use of our
          service. By accessing or using the platform, you agree to abide by these terms.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-neutral-300">
            By creating an account or otherwise using AstroLounge, you confirm that you
            have read, understood, and agree to be bound by these Terms. If you do not
            agree, you must discontinue use of the service immediately.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">2. User Responsibilities</h2>
          <p className="text-neutral-300">
            You are responsible for the content you post and for keeping your account
            secure. Please refrain from sharing content that infringes upon the rights of
            others or violates applicable laws.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">3. Content Ownership</h2>
          <p className="text-neutral-300">
            You retain ownership of the content you create. By posting content on the
            platform, you grant AstroLounge a limited license to display and distribute
            that content in connection with the service.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">4. Changes to These Terms</h2>
          <p className="text-neutral-300">
            We may update these Terms from time to time. We will notify you of any
            material changes, and your continued use of AstroLounge after such updates
            constitutes acceptance of the revised Terms.
          </p>
        </div>
      </section>

      <footer className="text-neutral-400">
        <p>
          If you have any questions about these Terms and Conditions, please contact our
          support team.
        </p>
      </footer>
    </div>
  );
};

export default TermsPage;
