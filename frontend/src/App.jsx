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
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';
import EdgeGlow from './components/common/EdgeGlow';
import { useAppContext } from './context/AppContext';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PlacementModule from './components/placement/PlacementModule';
import StudentPlacementView from './components/placement/StudentPlacementView';

const ProtectedRoute = ({ children }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" replace />;
  // First-login redirect: force password change before any protected page
  if (user.first_login) return <Navigate to="/change-password" replace />;
  return children;
};

function AppContent() {
  const { user } = useAppContext();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div
      className={`relative bg-[#F4EFE4] flex flex-col ${isDashboard || isAdmin ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <EdgeGlow />
      <Navbar />

      <div className={isDashboard || isAdmin ? 'flex-1 flex overflow-hidden' : 'flex-1 flex flex-col'}>
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
          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />
          <Route path="/admin/*" element={
            <ProtectedRoute>
              {(user?.role === 'admin' || user?.role === 'pr') ? <AdminDashboard /> : <Navigate to="/dashboard" replace />}
            </ProtectedRoute>
          } />

          <Route path="/pr/*" element={<Navigate to="/admin" replace />} />

          <Route path="/student" element={
            <ProtectedRoute>
              {user?.role === 'student' ? <StudentPlacementView /> : <Navigate to="/dashboard" replace />}
            </ProtectedRoute>
          } />

          {/* Protected Dashboard Routes - all handled inside Dashboard */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                {(user?.role === 'admin' || user?.role === 'pr') ? <Navigate to="/admin" replace /> : <Dashboard />}
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
