import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Phone, Loader2, AlertCircle, ArrowLeft, 
  ChevronDown, CheckCircle2, Eye, EyeOff, Users, Search, 
  BookOpen, Play, Camera, MoreHorizontal,
  Search as SearchIcon, Globe
} from 'lucide-react';
import Logo from '../components/Logo';
import API from '../services/api';
import countriesData from '../data/countries.json';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    source: ''
  });

  // Ensure all fields are blank on initial load, counteracting aggressive browser auto-fill
  useEffect(() => {
    const clearFields = () => {
      setFormData(prev => ({
        ...prev,
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        source: ''
      }));
    };
    
    // Clear immediately and again after delays to beat various browser behaviors
    clearFields();
    const t1 = setTimeout(clearFields, 100);
    const t2 = setTimeout(clearFields, 500);
    const t3 = setTimeout(clearFields, 1000);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Custom Selector States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState(countriesData[0]); // Default to India
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  
  const countryRef = useRef(null);
  const sourceRef = useRef(null);
  const navigate = useNavigate();

  // Handle outside clicks for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(event.target)) {
        setIsSourceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const filteredCountries = countriesData.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  const sources = [
    { value: 'LinkedIn', label: 'LinkedIn', icon: <Users size={16} className="text-[#0077B5]" /> },
    { value: 'Google Search', label: 'Google Search', icon: <Search size={16} className="text-[#4285F4]" /> },
    { value: 'Friend / Referral', label: 'Friend / Referral', icon: <Users size={16} className="text-[#F97316]" /> },
    { value: 'College / University', label: 'College / University', icon: <BookOpen size={16} className="text-[#6366F1]" /> },
    { value: 'YouTube', label: 'YouTube', icon: <Play size={16} className="text-[#FF0000]" /> },
    { value: 'Instagram', label: 'Instagram', icon: <Camera size={16} className="text-[#E4405F]" /> },
    { value: 'Other', label: 'Other', icon: <MoreHorizontal size={16} className="text-gray-400" /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!formData.source) {
      setError('Please tell us where you heard about us.');
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `${selectedCountry.code} ${formData.phoneNumber}`;
      const requestData = {
        ...formData,
        phoneNumber: fullPhoneNumber,
        email: formData.email.toLowerCase().trim()
      };
      
      const response = await API.post('/auth/register', requestData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center px-4 py-12 font-inter">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-[#F97316] transition-colors font-medium group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>

      {/* Logo */}
      <div className="mb-10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/')}>
        <Logo iconSize={44} primaryText="text-2xl" secondaryText="text-sm" gap="gap-3" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/50 p-8 md:p-12">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Join AI Placement</h1>
          <p className="text-gray-500 text-sm mt-3 font-medium">Smart intelligence for your next career move</p>
        </div>

        {success ? (
          <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-10 text-center animate-scale-in">
            <div className="w-20 h-20 bg-orange-100 text-[#F97316] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900">Account Created!</h3>
            <p className="text-gray-600 mt-3 font-medium">Preparing your professional dashboard...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 border border-red-100 p-4 rounded-2xl animate-fade-in font-bold">
                <AlertCircle size={18} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-focus-within:text-[#F97316] transition-colors">
                       <User size={18} />
                     </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    autoComplete="off"
                    name="fullName"
                    className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder:text-gray-400 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all text-sm font-semibold shadow-sm hover:bg-gray-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-focus-within:text-[#F97316] transition-colors">
                      <Mail size={18} />
                    </div>
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    name="email"
                    className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder:text-gray-400 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all text-sm font-semibold shadow-sm hover:bg-gray-100"
                  />
                </div>
              </div>

              {/* Phone Number with Custom Country Selector */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <div className="flex gap-3">
                  <div className="relative" ref={countryRef}>
                    <button
                      type="button"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      className="flex items-center gap-2 h-[58px] px-4 bg-gray-50 border border-transparent hover:bg-gray-100 rounded-2xl transition-all font-semibold text-gray-700 shadow-sm"
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span className="text-sm font-bold">{selectedCountry.code}</span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isCountryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCountryOpen && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[60] py-4 animate-scale-in origin-top-left overflow-hidden">
                        <div className="px-4 mb-3 border-none relative">
                          <SearchIcon className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.iso}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setIsCountryOpen(false);
                                setCountrySearch('');
                              }}
                              className="w-full flex items-center justify-between px-6 py-3 hover:bg-orange-50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{c.flag}</span>
                                <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{c.name}</span>
                              </div>
                              <span className="text-[10px] font-black text-gray-400">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-focus-within:text-[#F97316] transition-colors">
                        <Phone size={18} />
                      </div>
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      name="phoneNumber"
                      className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder:text-gray-400 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all text-sm font-semibold shadow-sm hover:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="relative group">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-focus-within:text-[#F97316] transition-colors">
                      <Lock size={18} />
                    </div>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    name="password"
                    className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder:text-gray-400 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all text-sm font-semibold shadow-sm hover:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#F97316] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-focus-within:text-[#F97316] transition-colors">
                      <Lock size={18} />
                    </div>
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder:text-gray-400 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all text-sm font-semibold shadow-sm hover:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#F97316] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Custom Source Dropdown */}
              <div className="md:col-span-2 relative" ref={sourceRef}>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Where did you hear about us?</label>
                <button
                  type="button"
                  onClick={() => setIsSourceOpen(!isSourceOpen)}
                  className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl py-4 px-5 flex items-center justify-between focus:outline-none focus:border-[#F97316] focus:bg-white transition-all text-sm font-bold shadow-sm hover:bg-gray-100 group"
                >
                  <div className="flex items-center gap-3">
                    {formData.source ? (
                      <>
                        {sources.find(s => s.value === formData.source)?.icon}
                        <span>{formData.source}</span>
                      </>
                    ) : (
                      <>
                        <Globe size={18} className="text-gray-300 group-focus-within:text-[#F97316]" />
                        <span className="text-gray-400">Select an option</span>
                      </>
                    )}
                  </div>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${isSourceOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSourceOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-gray-50 rounded-[2rem] shadow-2xl z-[60] py-3 animate-scale-in origin-bottom overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {sources.map((source) => (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, source: source.value }));
                            setIsSourceOpen(false);
                          }}
                          className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-orange-50 transition-all font-bold text-sm ${
                            formData.source === source.value ? 'text-[#F97316] bg-orange-50/50' : 'text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 ${formData.source === source.value ? 'border-orange-200' : ''}`}>
                            {source.icon}
                          </div>
                          {source.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 bg-[#F97316] text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-200 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-xl active:scale-[0.97]"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : null}
              {loading ? 'Processing...' : 'Ready to Launch'}
            </button>

            {/* Footer Links */}
            <div className="flex flex-col items-center gap-6 mt-10">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-gray-100 flex-1" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or continue to</span>
                <div className="h-px bg-gray-100 flex-1" />
              </div>
              
              <p className="text-sm font-bold text-gray-500">
                Already part of the team?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#F97316] font-black hover:underline underline-offset-8"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Legal Footer */}
      <p className="mt-12 text-[10px] font-bold text-gray-400 text-center max-w-sm leading-relaxed uppercase tracking-tighter">
        By creating an account, you agree to our <span className="text-gray-600 cursor-pointer hover:text-[#F97316]">Terms of Intelligence</span> and <span className="text-gray-600 cursor-pointer hover:text-[#F97316]">Data Protocols</span>.
      </p>

      {/* Inline styles for custom scrollbar and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0, 0, 0.2, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8f9fb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}
