import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import EdgeGlow from './components/common/EdgeGlow';
import { useAppContext } from './context/AppContext';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';

const ProtectedRoute = ({ children }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppContent() {
  const { user } = useAppContext();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="relative min-h-screen bg-[#060606] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <EdgeGlow />
      <Navbar />

      <div className={isDashboard ? 'flex-1 flex overflow-hidden' : 'flex-1 flex flex-col'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AnalyticsDashboard />} />

          {/* Protected Dashboard Routes - all handled inside Dashboard */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
