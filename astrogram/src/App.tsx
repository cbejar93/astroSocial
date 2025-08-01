import { Routes, Route, Navigate } from 'react-router-dom';
import Feed from './pages/Feed';
import UploadForm from './components/UploadForm/UploadForm';
import Navbar from './components/Navbar/Navbar';
import BottomNavbar from './components/BottomNavbar/BottomNavbar';
import WeatherPage from './pages/WeatherPage';
import { useWeatherService } from './hooks/useWeatherService';
import { useEffect } from "react";
import SignupPage from './pages/SignupPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import CompleteProfilePage from './pages/CompleteProfilePage'
import { RequireProfileCompletion } from "./components/auth/RequireProfileCompletion";
import PostPage from './pages/PostPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import UserPage from './pages/UserPage'





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
      <main className="flex-grow max-w-screen-lg w-full mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-24">
        <Routes>

          <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/success" element={<AuthSuccessPage />} />

        <Route path="/" element={<Feed />} />

        {/* single-post detail view */}
      <Route path="/posts/:id" element={<PostPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />

      <Route path="/users/:username" element={<UserPage />} />
      <Route path="/users/:username/:tab" element={<UserPage />} />

          <Route element={<RequireProfileCompletion />}>
          <Route path="/upload" element={<UploadForm />} />
          <Route path="/completeProfile" element={<CompleteProfilePage />} />
          <Route path="/profile" element={<Navigate to="/profile/posts" replace />} />
          <Route path="/profile/:tab" element={<ProfilePage />} />


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
          </Route>

        </Routes>
      </main>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </div>
  );
};

export default App;
