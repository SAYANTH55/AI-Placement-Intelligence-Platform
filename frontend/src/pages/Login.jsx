import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock, Mail, Loader2, AlertCircle, ArrowLeft, Zap } from 'lucide-react';
import Logo from '../components/Logo';

const DEMO_EMAIL = 'student@university.edu';
const DEMO_PASSWORD = '12345678';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || password.length < 6) {
      setError('Please enter a valid email and password (min 6 chars).');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setUser({ email, role: 'student', name: 'Deon' });
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use the demo credentials below.');
    }
    setLoading(false);
  };

  const handleAutoFill = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <Logo iconSize={40} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-orange-500">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Career Intelligence Portal</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-xl animate-fade-in">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Remember + forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
              Remember me
            </label>
            <a href="#" className="text-sm text-orange-500 font-semibold hover:underline">Forgot password?</a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-[#F97316] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Demo credentials with auto-fill button */}
        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Demo Credentials</p>
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors"
            >
              <Zap size={10} />
              Auto-Fill
            </button>
          </div>
          <p className="text-xs text-blue-600 font-mono">{DEMO_EMAIL} / {DEMO_PASSWORD}</p>
        </div>
      </div>
    </div>
  );
}
