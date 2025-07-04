import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Feed from './pages/Feed';
import UploadForm from './components/UploadForm/UploadForm';
import Navbar from './components/Navbar/Navbar';
import BottomNavbar from './components/BottomNavbar/BottomNavbar';
import WeatherPage from './pages/WeatherPage';


const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />

        {/* Main Content */}
        <main className="flex-grow max-w-screen-lg w-full mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-24">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/upload" element={<UploadForm />} />
            <Route path="/weather" element={<WeatherPage />} />

          </Routes>
        </main>

        {/* Bottom Navbar */}
        <BottomNavbar />
      </div>
    </Router>
  );
};

export default App;
