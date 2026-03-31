import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import UploadResume from './pages/UploadResume';
import JobInput from './pages/JobInput';
import Results from './pages/Results';
import { useAppContext } from './context/AppContext';
import './App.css';

function App() {
  const { user } = useAppContext();

  return (
    <Router>
      <div className="app-container">
        {user && <Navbar />}
        <div className="main-layout">
          {user && <Sidebar />}
          <main className="content-area">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/upload" />} />
              <Route path="/upload" element={user ? <UploadResume /> : <Navigate to="/login" />} />
              <Route path="/job-input" element={user ? <JobInput /> : <Navigate to="/login" />} />
              <Route path="/results" element={user ? <Results /> : <Navigate to="/login" />} />
              
              {/* Default fallback */}
              <Route path="*" element={<Navigate to={user ? "/upload" : "/login"} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
