import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { WatchPage } from './pages/WatchPage';
import { TrendingPage } from './pages/TrendingPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { VideosPage } from './pages/VideosPage';
import { CreatorsPage } from './pages/CreatorsPage';
import { CreatorDetailPage } from './pages/CreatorDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { DatingDiscoverPage } from './pages/DatingDiscoverPage';
import { DatingMatchesPage } from './pages/DatingMatchesPage';
import { DatingOnboardingPage } from './pages/DatingOnboardingPage';
import { PaymentsVerifyPage } from './pages/PaymentsVerifyPage';
import { TermsPage } from './pages/TermsPage';
import { ChatPage } from './pages/ChatPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import './index.css';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/trending" element={<ProtectedRoute><TrendingPage /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
          <Route path="/content/:id" element={<ProtectedRoute><WatchPage /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
          <Route path="/creators" element={<ProtectedRoute><CreatorsPage /></ProtectedRoute>} />
          <Route path="/creators/:id" element={<ProtectedRoute><CreatorDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/user-profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/dating/discover" element={<ProtectedRoute><DatingDiscoverPage /></ProtectedRoute>} />
          <Route path="/dating/matches" element={<ProtectedRoute><DatingMatchesPage /></ProtectedRoute>} />
          <Route path="/dating/setup" element={<ProtectedRoute><DatingOnboardingPage /></ProtectedRoute>} />
          <Route path="/payments/verify" element={<PaymentsVerifyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/chats" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/auth" element={<ProtectedRoute><AuthPage /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}
