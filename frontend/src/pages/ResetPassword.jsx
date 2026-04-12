import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import API from '../services/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier;
  const token = location.state?.token;

  if (!identifier || !token) {
    navigate('/forgot-password');
  }

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await API.post('/auth/reset-password', {
        identifier,
        token,
        new_password: password
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <Logo iconSize={40} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-orange-500">
            <KeyRound size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set New Password</h1>
          <p className="text-gray-500 text-sm mt-1">Create a secure password for your account</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center animate-scale-in">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-green-900 font-bold text-lg">Password Updated!</h3>
            <p className="text-green-700 text-sm mt-2">Your password has been reset successfully. Redirecting you to login...</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleReset}>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-4 rounded-xl animate-fade-in">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <ul className="text-[11px] space-y-1 text-gray-500">
                 <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-500' : ''}`}>
                    <CheckCircle2 size={10} /> At least 8 characters long
                 </li>
                 <li className={`flex items-center gap-1.5 ${password && password === confirmPassword ? 'text-green-500' : ''}`}>
                    <CheckCircle2 size={10} /> Passwords must match
                 </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !password || password !== confirmPassword}
              className="w-full flex justify-center items-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
