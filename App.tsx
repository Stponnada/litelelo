// src/App.tsx

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PostsProvider } from './contexts/PostsContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Spinner from './components/Spinner';

// --- LAZY-LOADED PAGES FOR CODE SPLITTING ---
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.HomePage })));
const Login = React.lazy(() => import('./pages/Login'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const PostPage = React.lazy(() => import('./pages/PostPage'));
const ProfileSetup = React.lazy(() => import('./pages/ProfileSetup'));
const DirectoryPage = React.lazy(() => import('./pages/DirectoryPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const NoInternetPage = React.lazy(() => import('./pages/NoInternetPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const CampusPage = React.lazy(() => import('./pages/CampusPage'));
const CampusDirectoryPage = React.lazy(() => import('./pages/CampusDirectoryPage'));
const PlaceDetailPage = React.lazy(() => import('./pages/PlaceDetailPage'));
const LostAndFoundPage = React.lazy(() => import('./pages/LostAndFoundPage'));
const MarketplacePage = React.lazy(() => import('./pages/MarketplacePage'));
const BitsCoinPage = React.lazy(() => import('./pages/BitsCoinPage'));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const ReputationPage = React.lazy(() => import('./pages/ReputationPage'));
const GroupInfoPage = React.lazy(() => import('./pages/GroupInfoPage'));
const NoticeboardPage = React.lazy(() => import('./pages/NoticeboardPage'));
const CommunitiesListPage = React.lazy(() => import('./pages/CommunitiesListPage'));
const CommunityPage = React.lazy(() => import('./pages/CommunityPage'));
const CommunityMembersPage = React.lazy(() => import('./pages/CommunityMembersPage'));
const BookmarksPage = React.lazy(() => import('./pages/BookmarksPage'));
const HelpCenterPage = React.lazy(() => import('./pages/HelpCenterPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const EasterEggPage = React.lazy(() => import('./pages/EasterEggPage'));
const RideSharePage = React.lazy(() => import('./pages/RideSharePage'));
const BlockchainPage = React.lazy(() => import('./pages/BlockchainPage'));
const PasswordResetPage = React.lazy(() => import('./pages/PasswordResetPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const CampusMapPage = React.lazy(() => import('./pages/CampusMapPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

// --- NEWLY ADDED IMPORTS ---
const MarketplaceItemPage = React.lazy(() => import('./pages/MarketplaceItemPage'));
const LostAndFoundItemPage = React.lazy(() => import('./pages/LostAndFoundItemPage'));
// ------------------------------------------

// Fallback component for Suspense
const FullPageSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
    <Spinner />
  </div>
);

const AppRoutes = () => {
  const { user, profile, isLoading } = useAuth();
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <Routes>
        <Route path="*" element={<NoInternetPage />} />
      </Routes>
    );
  }

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user && !profile) {
    return <FullPageSpinner />;
  }

  if (user && profile && !profile.profile_complete) {
    return (
      <Routes>
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/communities" element={<CommunitiesListPage />} />
        <Route path="/communities/:communityId" element={<CommunityPage />} />
        <Route path="/communities/:communityId/members" element={<CommunityMembersPage />} />
        <Route path="/campus" element={<CampusPage />} />
        <Route path="/campus/reviews" element={<CampusDirectoryPage />} />
        <Route path="/campus/reviews/:placeId" element={<PlaceDetailPage />} />
        <Route path="/campus/noticeboard" element={<NoticeboardPage />} />

        {/* --- MODIFIED ROUTES SECTION --- */}
        <Route path="/campus/lost-and-found" element={<LostAndFoundPage />} />
        <Route path="/campus/lost-and-found/:itemId" element={<LostAndFoundItemPage />} /> {/* NEW */}

        <Route path="/campus/marketplace" element={<MarketplacePage />} />
        <Route path="/campus/marketplace/:listingId" element={<MarketplaceItemPage />} /> {/* NEW */}
        {/* ----------------------------- */}

        <Route path="/campus/bits-coin" element={<BitsCoinPage />} />
        <Route path="/easter-egg/blockchain" element={<BlockchainPage />} />
        <Route path="/campus/ride-share" element={<RideSharePage />} />
        <Route path="/campus/events" element={<EventsPage />} />
        <Route path="/campus/events/:eventId" element={<EventDetailPage />} />
        <Route path="/campus/map" element={<CampusMapPage />} />
        <Route path="/reputation/:username" element={<ReputationPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:username" element={<ChatPage />} />
        <Route path="/chat/group/:conversationId" element={<GroupInfoPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Routes outside the main layout */}
      <Route path="/easter-egg" element={<EasterEggPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      <Route path="/setup" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PostsProvider>
            <ChatProvider>
              <NotificationProvider>
                {/* Wrap the routes in Suspense to enable code-splitting */}
                <Suspense fallback={<FullPageSpinner />}>
                  <AppRoutes />
                </Suspense>
              </NotificationProvider>
            </ChatProvider>
          </PostsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;