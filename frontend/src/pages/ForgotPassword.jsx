import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Loader2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import Logo from '../components/Logo';
import API from '../services/api';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/forgot-password', { identifier });
      console.log('OTP Sent:', response.data);
      setSuccess(true);
      // Pass identifier to verify OTP page
      setTimeout(() => {
        navigate('/verify-otp', { state: { identifier } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please check your email/phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      {/* Back to Login */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Login
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
            <Mail size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot Password?</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email or phone number to receive a security code</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center animate-scale-in">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send size={20} />
            </div>
            <h3 className="text-green-900 font-bold">OTP Sent!</h3>
            <p className="text-green-700 text-sm mt-1">Redirecting you to verification page...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-4 rounded-xl animate-fade-in">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email or Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="name@email.com or 9876543210"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                {identifier.includes('@') 
                  ? 'OTP will be sent to this email address.' 
                  : 'Enter your phone number (with or without country code). OTP will be sent to your registered email.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier}
              className="w-full flex justify-center items-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loading ? 'Sending Code...' : 'Send Security Code'}
            </button>

            <p className="text-center text-xs text-gray-400">
              OTP is always delivered to your registered email. Check spam if it doesn't arrive within 1 minute.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
