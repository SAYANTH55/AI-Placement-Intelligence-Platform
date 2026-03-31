import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate auth
    setUser({ email, role: 'student' });
    navigate('/upload');
  };

  return (
    <div className="login-container flex-center">
      <div className="login-box animate-fade-in card">
        <div className="login-header">
           <div className="brand-logo mb-4">AI</div>
           <h2>Welcome Back</h2>
           <p>Log in to your Placement Intelligence Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-primary w-100 flex-center" style={{marginTop: '24px'}}>
            <LogIn size={18} /> Login
          </button>
        </form>
      </div>
    </div>
  );
}
