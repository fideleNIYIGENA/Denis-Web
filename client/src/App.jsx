import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from './components/Loader.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Layout from './components/Layout.jsx';
import RequireAuth from './admin/components/RequireAuth.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Biography = lazy(() => import('./pages/Biography.jsx'));
const MusicPage = lazy(() => import('./pages/MusicPage.jsx'));
const VideosPage = lazy(() => import('./pages/VideosPage.jsx'));
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx'));
const EventsPage = lazy(() => import('./pages/EventsPage.jsx'));
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const SubscribePage = lazy(() => import('./pages/SubscribePage.jsx'));

const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'));
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard.jsx'));
const AdminSongs = lazy(() => import('./admin/AdminSongs.jsx'));
const AdminVideos = lazy(() => import('./admin/AdminVideos.jsx'));
const AdminGallery = lazy(() => import('./admin/AdminGallery.jsx'));
const AdminEvents = lazy(() => import('./admin/AdminEvents.jsx'));
const AdminNews = lazy(() => import('./admin/AdminNews.jsx'));
const AdminMessages = lazy(() => import('./admin/AdminMessages.jsx'));
const AdminComments = lazy(() => import('./admin/AdminComments.jsx'));
const AdminSubscribers = lazy(() => import('./admin/AdminSubscribers.jsx'));
const AdminAccounts = lazy(() => import('./admin/AdminAccounts.jsx'));
const AdminSocial = lazy(() => import('./admin/AdminSocial.jsx'));
const AdminSettings = lazy(() => import('./admin/AdminSettings.jsx'));
const AdminProfile = lazy(() => import('./admin/AdminProfile.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/biography" element={<Biography />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="songs" element={<AdminSongs />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="social" element={<AdminSocial />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
