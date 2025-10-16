// src/pages/HelpCenterPage.tsx

import React from 'react';
import { QuestionMarkCircleIcon } from '../components/icons';

// Reusable section component
const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-secondary-light dark:bg-secondary p-6 rounded-xl border border-tertiary-light dark:border-tertiary shadow-lg">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1.5 h-8 bg-brand-green rounded-full"></div>
      <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">{title}</h2>
    </div>
    <div className="pl-6 space-y-4 text-text-secondary-light dark:text-text-secondary leading-relaxed">
      {children}
    </div>
  </section>
);

const HelpCenterPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 flex items-center justify-center">
          <QuestionMarkCircleIcon className="w-8 h-8 text-brand-green" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">
            Help Center
          </h1>
          <p className="text-lg text-text-secondary-light dark:text-text-secondary">
            Your guide to using litelelo.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">

        <HelpSection title="Getting Started">
          <p>
            Welcome to <strong>litelelo.</strong>, the exclusive social network for BITS Pilani students.
            To get started, you must sign up using your official BITS Pilani email address
            (e.g., <code>f20xxxxxx@hyderabad/goa/pilani.bits-pilani.ac.in</code>).
          </p>
          <p>
Pick a username that shows off your vibe — it doesn’t have to be your real name, so go wild! Just don’t forget to add your actual name in the Full Name section so your friends know it’s really you. You can change this from the profile page later.
          </p>
        </HelpSection>

        <HelpSection title="The Feed (Home)">
          <p>
            The Home page is your main feed. Here you'll see posts from people you follow and from
            communities you're a member of.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Create Posts:</strong> Use the "What's happening?" box to share text, images, or create polls.</li>
            <li><strong>Interact:</strong> You can <strong>Like</strong>, <strong>Comment</strong> on, and <strong>Bookmark</strong> posts for later.</li>
            <li><strong>Discover:</strong> The feed is sorted by the newest posts, so you're always up-to-date.</li>
          </ul>
        </HelpSection>

        <HelpSection title="Campus Hub">
          <p>
            The <strong>Campus</strong> section is your one-stop-shop for campus-specific services.
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong>Marketplace:</strong> A safe place to buy and sell items like textbooks, electronics,
              and more with other students. You can create listings and contact sellers directly through chat.
            </li>
            <li>
              <strong>Lost & Found:</strong> Lost your ID card? Found a wallet? Post it here. This feature helps
              reconnect lost items with their owners.
            </li>
            <li>
              <strong>Campus Places:</strong> Discover and review places on campus like canteens, shops, and hangout spots.
              See what's popular and share your own ratings.
            </li>
          </ul>
        </HelpSection>

        <HelpSection title="Chat & Messaging">
          <p>
            Stay connected with friends and groups through direct and group messaging.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Start a Chat:</strong> Click the "Message" button on someone's profile to start a new conversation.</li>
            <li><strong>Group Chats:</strong> Create group chats with multiple friends to plan events, discuss projects, or just hang out.</li>
            <li><strong>Features:</strong> Share text, images, and GIFs. You can also react to messages and reply directly to keep things organized.</li>
          </ul>
        </HelpSection>

        <HelpSection title="Profiles & Directory">
          <p>Find and connect with anyone on campus.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Directory:</strong> Browse all registered users and communities. Filter users by batch, branch, or dorm to find specific people.</li>
            <li><strong>Profiles:</strong> Each user has a profile showing their posts, bio, and info. From here, you can <strong>Follow</strong> them to see their posts in your feed.</li>
            <li><strong>Editing Your Profile:</strong> Click "Edit Profile" to update your information, profile picture, or banner anytime.</li>
          </ul>
        </HelpSection>

        <HelpSection title="Communities">
          <p>
            Communities are user-created groups for clubs, batches, interests, or any other topic.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Join & Participate:</strong> Join any community to see its posts and participate in discussions.</li>
            <li><strong>Public vs. Member Posts:</strong> Communities can have a public feed (visible to everyone) and a private feed (visible only to members).</li>
            <li><strong>Create a Community:</strong> Don’t see a group for your interest? Create your own from the Communities page!</li>
          </ul>
        </HelpSection>

      </div>
    </div>
  );
};

export default HelpCenterPage;
