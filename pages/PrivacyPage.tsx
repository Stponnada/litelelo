// src/pages/PrivacyPage.tsx

import React from 'react';
import { LockClosedIcon } from '../components/icons';

// Reusable section component
const PrivacySection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-3">
    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main border-l-4 border-brand-green pl-3">
      {title}
    </h2>
    <div className="pl-4 text-text-secondary-light dark:text-text-secondary leading-relaxed space-y-3">
      {children}
    </div>
  </section>
);

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <LockClosedIcon className="w-8 h-8 text-brand-green" />
        </div>
        <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">
          Privacy Policy
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
          Your privacy is critically important to us. At <strong>litelelo.</strong>, we have a few
          fundamental principles: we are thoughtful about the personal information we ask you to
          provide and the personal information that we collect about you through the operation of
          our services. We store personal information for only as long as we have a reason to keep
          it. We aim for full transparency on how we gather, use, and share your personal
          information.
        </p>

        <PrivacySection title="1. Information We Collect">
          <h3 className="text-lg font-semibold text-text-main-light dark:text-text-main">
            Information You Provide to Us
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account Information:</strong> We collect information you provide to create
              your account, including your BITS Pilani email, a username, and password.
            </li>
            <li>
              <strong>Profile Information:</strong> We collect the information you provide for your
              user profile, such as your full name, bio, profile picture, banner image, campus,
              branch, dorm, and other optional details.
            </li>
            <li>
              <strong>Content You Create:</strong> We collect the content you create on the
              platform. This includes posts, comments, poll votes, messages, marketplace listings,
              and reviews you write.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-text-main-light dark:text-text-main pt-2">
            Information We Collect Automatically
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Log and Usage Data:</strong> Like most online services, we collect information
              that web browsers and mobile devices typically make available, such as IP address,
              browser type, and date and time of access.
            </li>
            <li>
              <strong>Local Storage:</strong> We use local storage to keep you logged in and to
              remember your preferences (like your light/dark mode theme).
            </li>
          </ul>
        </PrivacySection>

        <PrivacySection title="2. How We Use Your Information">
          <p>We use information about you for the purposes listed below:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve our services.</li>
            <li>To personalize your experience, such as showing you relevant content in your feed.</li>
            <li>To allow you to communicate with other users.</li>
            <li>
              To monitor and protect the security of our services and enforce our Terms of Service.
            </li>
          </ul>
        </PrivacySection>

        <PrivacySection title="3. How We Share Your Information">
          <p>
            We do not sell our users&apos; private personal information. We share information about
            you in the limited circumstances spelled out below:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Publicly on the Platform:</strong> Information that you choose to make public
              is disclosed publicly. That means information like your public profile, posts,
              comments, and community memberships are available to others.
            </li>
            <li>
              <strong>With Other Users:</strong> When you send a private message or post in a
              members-only community, that information is shared with the intended recipients.
            </li>
            <li>
              <strong>Third-Party Vendors:</strong> We use Supabase as our backend provider for
              database, authentication, storage, and real-time services. You can view their privacy
              policy for more information.
            </li>
            <li>
              <strong>Legal Requests:</strong> We may disclose information about you in response to a
              subpoena, court order, or other governmental request.
            </li>
          </ul>
        </PrivacySection>

        <PrivacySection title="4. Your Rights and Choices">
          <p>You have several choices available when it comes to information about you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Edit Your Profile:</strong> You can access and update your profile information
              at any time through the &quot;Edit Profile&quot; button on your profile page.
            </li>
            <li>
              <strong>Delete Your Content:</strong> You can delete your posts and comments.
            </li>
            <li>
              <strong>Delete Your Account:</strong> You can request account deletion by contacting
              support. Please note that some information may remain in our backups and logs for a
              period of time before being completely removed.
            </li>
          </ul>
        </PrivacySection>

        <PrivacySection title="5. Data Security">
          <p>
            While no online service is 100% secure, we work very hard to protect information about
            you against unauthorized access, use, alteration, or destruction. We utilize the
            security features provided by our backend provider, Supabase, to safeguard your data.
            Your <b>litelelo.</b> password is encrypted on our servers, and no member of the litelelo team can access your password under any circumstance.
          </p>
        </PrivacySection>

        <PrivacySection title="6. Contact Us">
          <p>
            If you have any questions about this Privacy Policy, please contact us at
            <a
              href="f20250080@hyderabad.bits-pilani.ac.in"
              className="text-brand-green hover:underline"
            >
              f20250080@hyderabad.bits-pilani.ac.in
            </a>{' '}

            or{' '}

             <a
              href="f20252422@hyderabad.bits-pilani.ac.in"
              className="text-brand-green hover:underline"
            >
              f20252422@hyderabad.bits-pilani.ac.in
            </a>{' '}

          </p>
        </PrivacySection>
      </div>
    </div>
  );
};

export default PrivacyPage;
