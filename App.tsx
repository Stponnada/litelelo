// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PostsProvider } from './contexts/PostsContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { HomePage as Home } from './pages/Home';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import PostPage from './pages/PostPage';
import ProfileSetup from './pages/ProfileSetup';
import DirectoryPage from './pages/DirectoryPage';
import NotFound from './pages/NotFound';
import NoInternetPage from './pages/NoInternetPage';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import Spinner from './components/Spinner';
import CampusPage from './pages/CampusPage';
import CampusDirectoryPage from './pages/CampusDirectoryPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import LostAndFoundPage from './pages/LostAndFoundPage';
import MarketplacePage from './pages/MarketplacePage';
import BitsCoinPage from './pages/BitsCoinPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ReputationPage from './pages/ReputationPage';
import GroupInfoPage from './pages/GroupInfoPage';
import NoticeboardPage from './pages/NoticeboardPage'; 
import CommunitiesListPage from './pages/CommunitiesListPage';
import CommunityPage from './pages/CommunityPage';
import CommunityMembersPage from './pages/CommunityMembersPage';
import BookmarksPage from './pages/BookmarksPage';
import HelpCenterPage from './pages/HelpCenterPage';
import TermsPage from './pages/TermsPage'; 
import PrivacyPage from './pages/PrivacyPage';
import EasterEggPage from './pages/EasterEggPage';
import RideSharePage from './pages/RideSharePage';

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
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user && !profile?.profile_complete) {
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
        <Route path="/campus/noticeboard" element={<NoticeboardPage />} /> {/* <-- Add this route */}
        <Route path="/campus/lost-and-found" element={<LostAndFoundPage />} />
        <Route path="/campus/marketplace" element={<MarketplacePage />} />
        <Route path="/campus/bits-coin" element={<BitsCoinPage />} />
        <Route path="/campus/ride-share" element={<RideSharePage />} />
        <Route path="/campus/events" element={<EventsPage />} />
        <Route path="/campus/events/:eventId" element={<EventDetailPage />} />
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
      </Route>

      {/* Routes outside the main layout */}
      <Route path="/easter-egg" element={<EasterEggPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
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
              <NotificationProvider> {/* <-- WRAP HERE */}
                <AppRoutes />
              </NotificationProvider>
            </ChatProvider>
          </PostsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
