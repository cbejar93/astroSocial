import { Routes, Route } from 'react-router-dom';
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




const App: React.FC = () => {

  const { weather, loading, error } = useWeatherService();

  console.log('🔍 2VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL);


  useEffect(() => {
    if (weather) {
      console.log('User location:', weather);
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
          <Route path="/completeProfile" element={<CompleteProfilePage />} />

          <Route element={<RequireProfileCompletion />}>
            <Route path="/upload" element={<UploadForm />} />
            <Route path="/" element={<Feed />} />

            <Route
              path="/weather"
              element={
                <WeatherPage
                  weather={weather}
                  loading={loading}
                  error={error}
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
