import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock, Mail, Loader2, AlertCircle, ArrowLeft, Zap } from 'lucide-react';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';
import API from '../services/api';

const DEMO_EMAIL = 'student@university.edu';
const DEMO_PASSWORD = '12345678';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || password.length < 6) {
      setError('Please enter a valid email and password (min 6 chars).');
      return;
    }

    setLoading(true);
    try {
      // First try real API login
      const response = await API.post('/auth/login', { email, password });
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      // Fallback for demo credentials
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        setUser({ email, role: 'student', name: 'Deon' });
        navigate('/dashboard');
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#F97316]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-[#555] hover:text-white transition-colors z-10"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Logo */}
      <div className="mb-8 cursor-pointer relative z-10" onClick={() => navigate('/')}>
        <Logo iconSize={40} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#0A0A0A] rounded-[2rem] border border-[#1E1E1E] shadow-[0_40px_80px_rgba(0,0,0,0.5)] p-8 relative z-10 overflow-hidden"
      >
        {/* Top neon line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F97316] to-transparent opacity-70" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#F97316]/10 border border-[#F97316]/30 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[#F97316] shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-[#555] text-sm mt-1">Sign in to your Career Intelligence Portal</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#555] uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#444]">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="off"
                className="w-full bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder:text-[#444] rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#F97316]/50 focus:bg-[#111] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#555] uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#444]">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="new-password"
                className="w-full bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder:text-[#444] rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#F97316]/50 focus:bg-[#111] transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Remember + forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
              <input type="checkbox" className="rounded border-[#333] bg-[#111] text-[#F97316] focus:ring-[#F97316]" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-[#F97316] font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-black text-sm hover:bg-orange-500 transition-colors duration-200 shadow-[0_0_20px_rgba(249,115,22,0.2)] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={16} className="fill-white" />}
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </motion.button>
        </form>

        {/* Demo credentials */}
        <div className="mt-5 bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl p-4">
          <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1.5">Demo Access Credentials</p>
          <div className="flex items-center justify-between text-xs text-[#888] font-mono bg-[#0A0A0A] p-2 rounded-lg border border-[#1A1A1A]">
            <span>{DEMO_EMAIL}</span>
            <span className="text-[#333] mx-2">|</span>
            <span>{DEMO_PASSWORD}</span>
          </div>
        </div>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm font-medium text-[#555]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-[#F97316] font-bold hover:underline underline-offset-4"
          >
            Create one now
          </button>
        </p>
      </motion.div>
    </div>
  );
}
