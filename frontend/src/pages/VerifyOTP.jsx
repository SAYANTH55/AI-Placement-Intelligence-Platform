import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import API from '../services/api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier;

  useEffect(() => {
    if (!identifier) {
      navigate('/forgot-password');
    }
    
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [identifier, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/verify-otp', {
        identifier,
        otp: otpCode
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/reset-password', { state: { identifier, token: response.data.reset_token } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid security code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { identifier });
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      <button
        onClick={() => navigate('/forgot-password')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Change Email/Phone
      </button>

      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <Logo iconSize={40} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-orange-500">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Security Check</h1>
          <p className="text-gray-500 text-sm mt-1">
            We've sent a 6-digit code to <br />
            <span className="font-semibold text-gray-700">{identifier}</span>
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center animate-scale-in">
             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-green-900 font-bold">Code Verified!</h3>
            <p className="text-green-700 text-sm mt-1">Directing to password reset...</p>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={handleVerify}>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-4 rounded-xl animate-fade-in">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                />
              ))}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || loading}
                className="flex items-center gap-2 mx-auto text-sm font-semibold text-orange-500 hover:text-orange-600 disabled:text-gray-400 transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code Now'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex justify-center items-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
