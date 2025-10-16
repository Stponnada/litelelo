// src/pages/TermsPage.tsx

import React from 'react';
import { ShieldCheckIcon } from '../components/icons';

// Reusable section component
const TOSSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main border-l-4 border-brand-green pl-3">
      {title}
    </h2>
    <div className="pl-4 text-text-secondary-light dark:text-text-secondary leading-relaxed space-y-3">
      {children}
    </div>
  </section>
);

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-brand-green" />
        </div>
        <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">
          Terms of Service
        </h1>
        <p className="text-md text-text-tertiary-light dark:text-text-tertiary mt-2">
          Last Updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 bg-secondary-light dark:bg-secondary p-8 rounded-xl border border-tertiary-light dark:border-tertiary">
        <p className="text-text-secondary-light dark:text-text-secondary">
          Welcome to <strong>litelelo.</strong> These terms and conditions outline the rules and
          regulations for the use of our platform, designed exclusively for the BITS Pilani
          community. By accessing and using this website, you accept these terms in full.
        </p>

        <TOSSection title="1. Eligibility and Account">
          <p>
            You must be a current student, faculty member, or alumni of a BITS Pilani campus to use
            this service. Registration requires a valid BITS Pilani email address.
          </p>
          <p>
            You are responsible for maintaining the security of your account and for all activities
            that occur under your account.
          </p>
        </TOSSection>

        <TOSSection title="2. User Conduct and Content">
          <p>
            As a member of the BITS Pilani community, you agree to interact with others respectfully.
            You are solely responsible for the content you post. You agree not to post content that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Is illegal, hateful, discriminatory, threatening, or incites violence.</li>
            <li>Contains harassment, bullying, or personal attacks.</li>
            <li>Infringes on any intellectual property rights (e.g., copyright).</li>
            <li>Spreads misinformation or spam.</li>
            <li>Impersonates another person or entity.</li>
          </ul>
        </TOSSection>

        <TOSSection title="3. Academic Integrity">
          <p>
            This platform must not be used to facilitate any form of academic dishonesty, including
            but not limited to cheating, plagiarism, or unauthorized collaboration on academic work.
            Sharing of assignment solutions, exam papers, or any other material in a way that
            violates the academic policies of BITS Pilani is strictly prohibited.
          </p>
        </TOSSection>

        <TOSSection title="4. Marketplace and Transactions">
          <p>
            The Marketplace is a platform for users to connect. We are not a party to any
            transaction and do not guarantee the quality, safety, or legality of items listed. All
            transactions are conducted at your own risk. The Litelelo marketplace is merely a medium for users to advertise their products.
          </p>
        </TOSSection>

        <TOSSection title="5. Content Ownership and License">
          <p>
            You retain ownership of the content you create and post on <strong>litelelo.</strong>{' '}
            However, by posting content, you grant us a worldwide, non-exclusive, royalty-free
            license to use, display, reproduce, and distribute your content on and through our
            service.
          </p>
        </TOSSection>

        <TOSSection title="6. Platform Rights and Termination">
          <p>
            We reserve the right, at our sole discretion, to remove any content or suspend/terminate
            any account that violates these terms without prior notice.
          </p>
          <p>You may terminate your account at any time by navigating to your profile settings.</p>
        </TOSSection>

        <TOSSection title="7. Disclaimers and Limitation of Liability">
          <p>
            This service is provided <strong>"AS IS"</strong> without any warranties. We are not
            liable for any damages or losses arising from your use of, or inability to use, the
            service.
          </p>
        </TOSSection>

        <TOSSection title="8. Privacy">
          <p>
            Your privacy is important to us. Our Privacy Policy, available separately, explains how
            we collect, use, and share information about you.
          </p>
        </TOSSection>

        <TOSSection title="9. Changes to Terms">
          <p>
            We may revise these Terms of Service at any time. By continuing to use the platform
            after revisions become effective, you agree to be bound by the revised terms.
          </p>
        </TOSSection>

        <TOSSection title="10. Contact Us">
          <p>
            If you have any questions about these Terms, please contact us at{' '} 
            <a
              href="mailto:f20250080@hyderabad.bits-pilani.ac.in"
              className="text-brand-green hover:underline"
            >
              f20250080@hyderabad.bits-pilani.ac.in
            </a>{' '}

            or {' '}
            <a
              href="mailto:f20252422@hyderabad.bits-pilani.ac.in"
              className="text-brand-green hover:underline"
            >
              f20252422@hyderabad.bits-pilani.ac.in
            </a>{' '}
          </p>
        </TOSSection>
      </div>
    </div>
  );
};

export default TermsPage;
