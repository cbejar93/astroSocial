import { Routes, Route, Navigate } from 'react-router-dom';
import Feed from './pages/Feed';
import UploadForm from './components/UploadForm/UploadForm';
import Navbar from './components/Navbar/Navbar';
import BottomNavbar from './components/BottomNavbar/BottomNavbar';
import DesktopNav from './components/Sidebar/DesktopNav';
import WeatherPage from './pages/WeatherPage';
import { useWeatherService } from './hooks/useWeatherService';
import { useEffect } from "react";
import SignupPage from './pages/SignupPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import CompleteProfilePage from './pages/CompleteProfilePage'
import { RequireProfileCompletion } from "./components/auth/RequireProfileCompletion";
import RequireAdmin from './components/auth/RequireAdmin';
import PostPage from './pages/PostPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import UserPage from './pages/UserPage'
import LoungePage from './pages/LoungePage'
import LoungesPage from './pages/LoungesPage'
import LoungePostPage from './pages/LoungePostPage'
import LoungePostDetailPage from './pages/LoungePostDetailPage'
import AdminPage from './pages/AdminPage'

import NotFoundPage from './pages/NotFoundPage'
import SearchPage from './pages/SearchPage'






const App: React.FC = () => {

  const { weather, loading, error, unit, setUnit } = useWeatherService();



  useEffect(() => {
    if (weather) {
      // You could now call your NestJS backend with this data
    }
  }, [weather]);


  return (

    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow bg-gray-900">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 pt-6 pb-24 md:grid md:grid-cols-[18rem,minmax(0,1fr),16rem] md:gap-8">
          <aside className="hidden md:flex md:w-64 md:flex-col" aria-label="Primary navigation">
            <DesktopNav />
          </aside>
          <section className="w-full min-w-0">
            <Routes>
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<SignupPage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route element={<RequireProfileCompletion />}>
                <Route path="/" element={<Feed />} />
                {/* single-post detail view */}
                <Route path="/posts/:id" element={<PostPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/users/:username" element={<UserPage />} />
                <Route path="/users/:username/:tab" element={<UserPage />} />
                <Route path="/lounge" element={<LoungesPage />} />
                <Route path="/lounge/:loungeName" element={<LoungePage />} />
                <Route path="/lounge/:loungeName/posts/:postId" element={<LoungePostDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/lounge/:loungeName/post" element={<LoungePostPage />} />
                <Route path="/upload" element={<UploadForm />} />
                <Route path="/completeProfile" element={<CompleteProfilePage />} />
                <Route path="/profile" element={<Navigate to="/profile/posts" replace />} />
                <Route path="/profile/:tab" element={<ProfilePage />} />
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
          </section>
          <aside className="hidden lg:block lg:w-64" aria-hidden="true">
            {/* Right sidebar placeholder */}
          </aside>
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
