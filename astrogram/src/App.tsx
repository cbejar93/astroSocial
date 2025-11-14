// src/App.tsx
import { Routes, Route, Navigate, useLocation, type Location } from "react-router-dom";
import { useEffect } from "react";
// import LoungePostModal from "./components/Modal/LoungePostModal";

import Feed from "./pages/Feed";
import UploadForm from "./components/UploadForm/UploadForm";
import Navbar from "./components/Navbar/Navbar";
import BottomNavbar from "./components/BottomNavbar/BottomNavbar";
import DesktopNav from "./components/Sidebar/DesktopNav";
import WeatherPage from "./pages/WeatherPage";
import { useWeatherService } from "./hooks/useWeatherService";

import SignupPage from "./pages/SignupPage";
import AuthSuccessPage from "./pages/AuthSuccessPage";
import SupabaseAuthCallbackPage from "./pages/SupabaseAuthCallbackPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import { RequireProfileCompletion } from "./components/auth/RequireProfileCompletion";
import RequireAdmin from "./components/auth/RequireAdmin";

import PostPage from "./pages/PostPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import UserPage from "./pages/UserPage";
import LoungePage from "./pages/LoungePage";
import LoungesPage from "./pages/LoungesPage";
// import LoungePostModal from "./pages/LoungePostPage";
// import LoungePostPage from "./pages/LoungePostPage";
import LoungePostDetailPage from "./pages/LoungePostDetailPage";
import AdminPage from "./pages/AdminPage";
import SavedPage from "./pages/SavedPage";

import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from "./pages/SearchPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CommunityGuidelinesPage from "./pages/CommunityGuidelinesPage";
import ProfileOverviewPage from "./pages/ProfileOverviewPage";
import SettingsPage from "./pages/SettingsPage";

import PageModal from "./components/Modal/PageModal";
import AuroraBackground from "./components/Layout/AuroraBackground";

const App: React.FC = () => {
  const { weather, loading, error, unit, setUnit } = useWeatherService();

  const location = useLocation();
  const state = location.state as { modal?: boolean; backgroundLocation?: Location } | undefined;

  // Detect if we are on /settings/* and which modal slug
  const modalSlug =
    location.pathname.startsWith("/settings/") ? location.pathname.split("/")[2] : undefined;
  const isSettingsModal =
    modalSlug && ["terms", "privacy", "community-guidelines"].includes(modalSlug);

  useEffect(() => {
    if (weather) {
      // optional: send to backend
    }
  }, [weather]);

  return (
    <div className="flex min-h-screen flex-col text-white overflow-x-hidden">
      {/* Global background: fixes “black box” at the bottom */}
      <AuroraBackground />

      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 pt-6 pb-20 md:grid md:grid-cols-[18rem,minmax(0,1fr),16rem] md:gap-8">
          <aside className="hidden md:flex md:w-64 md:flex-col" aria-label="Primary navigation">
            <DesktopNav />
          </aside>

          <section className="w-full min-w-0">
            {/* Base routes (render behind modal if one is open via route state) */}
            <Routes
              location={
                state?.modal && state.backgroundLocation ? state.backgroundLocation : location
              }
            >
              {/* Public legal pages for direct linking */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />

              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<SignupPage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/auth/supabase" element={<SupabaseAuthCallbackPage />} />

              <Route element={<RequireProfileCompletion />}>
                <Route path="/" element={<Feed />} />
                {/* single-post detail view */}
                <Route path="/posts/:id" element={<PostPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/users/:username" element={<UserPage />} />
                <Route path="/users/:username/:tab" element={<UserPage />} />
                <Route path="/lounge" element={<LoungesPage />} />
                <Route path="/lounge/:loungeName" element={<LoungePage />} />
                <Route path="/lounge/:loungeName/posts/:postId" element={<LoungePostDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                {/* <Route path="/lounge/:loungeName/post" element={<LoungePostModal />} /> */}
                <Route path="/upload" element={<UploadForm />} />
                <Route path="/completeProfile" element={<CompleteProfilePage />} />
                <Route path="/profile" element={<ProfileOverviewPage />} />
                <Route path="/profile/:tab" element={<ProfilePage />} />

                {/* Settings (plus slug so /settings/terms shows the page behind the modal) */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/:slug" element={<SettingsPage />} />

                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<Navigate to="/admin/lounge" replace />} />
                  <Route path="/admin/:tab" element={<AdminPage />} />
                </Route>

                <Route
                  path="/weather"
                  element={
                    <WeatherPage
                      weather={weather}
                      loading={loading}
                      error={error}
                      unit={unit}
                      setUnit={setUnit}
                    />
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>

            {/* Modal overlays for settings legal pages (protected paths) */}
            {isSettingsModal && (
              <Routes>
                <Route
                  path="/settings/terms"
                  element={
                    <PageModal title="Terms of Service" maxWidthClass="max-w-4xl">
                      <TermsPage />
                    </PageModal>
                  }
                />
                <Route
                  path="/settings/privacy"
                  element={
                    <PageModal title="Privacy Policy" maxWidthClass="max-w-4xl">
                      <PrivacyPolicyPage />
                    </PageModal>
                  }
                />
                <Route
                  path="/settings/community-guidelines"
                  element={
                    <PageModal title="Community Guidelines" maxWidthClass="max-w-4xl">
                      <CommunityGuidelinesPage />
                    </PageModal>
                  }
                />
              </Routes>
            )}
          </section>

          <aside className="hidden lg:block lg:w-64" aria-hidden="true" />
        </div>
      </main>

      {/* Bottom Navbar */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default App;
