import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, ArrowRight, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Logo from '../components/Logo';

const brands = ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Accenture", "IBM", "Deloitte"];

const LandingPage = () => {
  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || password.length < 6) {
      setError('Please enter a valid email and password.');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === 'student@university.edu' && password === '12345678') {
      setUser({ email, role: 'student', name: 'Deon' });
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#F8F9FB] flex flex-col overflow-x-hidden relative font-inter selection:bg-orange-500/20 selection:text-orange-900">

      {/* Global CSS for Hardware Acceleration & Pure CSS Marquee */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hardware-accelerated {
           will-change: transform;
           transform: translateZ(0);
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
        .group:hover .animate-scroll {
          animation-play-state: paused;
        }
      `}} />

      {/* Main Split Screen Area */}
      <div className="flex flex-col lg:flex-row min-h-screen relative">
        {/* Decorative Minimal background: exactly ONE floating shape */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [-15, 15, -15], rotate: 360 }}
            transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 30, repeat: Infinity, ease: "linear" } }}
            className="absolute top-10 left-10 w-[400px] h-[400px] border border-orange-500/10 rounded-full border-dashed hardware-accelerated"
          />
        </div>

        {/* Navbar */}
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-0 left-0 right-0 z-50 px-6 py-6 hardware-accelerated"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-[8px] border border-slate-200 px-8 py-4 rounded-full shadow-sm">

            {/* New Logo Integration 1: Navbar */}
            <Logo iconSize={36} primaryText="text-xl" secondaryText="text-sm hidden lg:block" gap="gap-3" />

            <div className="hidden lg:flex items-center gap-10 font-medium text-[#64748B]">
              {[
                { label: 'Home', path: '/' },
                { label: 'Features', path: '/features' },
                { label: 'How it Works', path: '/how-it-works' },
                { label: 'Contact', path: '/contact' },
              ].map(({ label, path }, i) => (
                <button
                  key={i}
                  onClick={() => navigate(path)}
                  className="relative group hover:text-[#F97316] transition-colors duration-200 bg-transparent border-none cursor-pointer font-medium text-[#64748B]"
                >
                  {label}
                  <span className="absolute -bottom-1.5 left-0 w-full h-0.5 bg-[#F97316] origin-left scale-x-0 transition-transform duration-200 ease-in-out group-hover:scale-x-100 rounded-full hardware-accelerated" />
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="hidden lg:flex items-center gap-2 bg-[#0F172A] text-white px-6 py-2.5 rounded-full font-semibold hover:scale-105 hover:-translate-y-1 hover:shadow-md hover:bg-[#F97316] transition-all duration-200 ease-in-out hardware-accelerated"
            >
              Start Hub
              <Zap className="w-4 h-4 text-orange-400" />
            </button>
          </div>
        </motion.nav>

        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full lg:w-7/12 min-h-[90vh] flex flex-col justify-center pt-32 pb-40 px-8 lg:px-16 xl:px-24 relative z-10 hardware-accelerated"
        >
          <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-2xl">

            {/* New Logo Integration 2: Hero Section Branding */}
            <motion.div variants={slideUp} className="mb-4 hardware-accelerated">
              <Logo iconSize={28} primaryText="text-base" secondaryText="text-xs" gap="gap-2" />
            </motion.div>

            <motion.div variants={slideUp} className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-sm font-semibold hover:-translate-y-1 transition-transform duration-200 hardware-accelerated cursor-default shadow-sm">
              <Sparkles className="w-4 h-4" /> Smart Career Tracking
            </motion.div>

            <motion.h1 variants={slideUp} className="text-5xl lg:text-7xl font-bold text-[#0F172A] mb-6 tracking-tight leading-[1.1]">
              Placement <br />
              <span className="text-[#F97316]">Intelligence</span>
            </motion.h1>

            <motion.p variants={slideUp} className="text-lg lg:text-xl text-[#64748B] mb-10 leading-relaxed font-medium max-w-xl">
              Bridge the gap between ambition and industry demand. Transform raw resumes into highly accurate, AI-driven career roadmaps.
            </motion.p>

            <motion.div variants={slideUp} className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-[#F97316] text-white px-8 py-4 rounded-full font-bold text-lg shadow-sm flex items-center justify-center gap-3 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-md hover:bg-orange-600 transition-all duration-200 ease-in-out group hardware-accelerated"
              >
                Access Platform
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200 ease-in-out hardware-accelerated" />
              </button>

              <button
                className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-[#0F172A] bg-white border border-slate-200 shadow-sm flex justify-center items-center hover:scale-[1.03] hover:-translate-y-1 hover:shadow-md hover:bg-slate-50 transition-all duration-200 ease-in-out hardware-accelerated"
              >
                Watch Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Lightweight Pure CSS Marquee Section */}
          <div className="absolute bottom-0 left-0 right-0 py-8 overflow-hidden bg-gradient-to-t from-slate-100/50 to-transparent">
            <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-4 px-8 lg:px-16 hardware-accelerated">
              Trusted by Students from
            </p>
            <div className="flex group overflow-hidden">
              <div className="flex gap-16 px-8 whitespace-nowrap animate-scroll hardware-accelerated" style={{ paddingRight: '4rem', width: 'max-content' }}>
                {[...brands, ...brands].map((brand, i) => (
                  <span key={i} className="text-3xl font-extrabold text-slate-300 hover:text-[#F97316] transition-colors duration-200 cursor-default">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="w-full lg:w-5/12 min-h-[60vh] lg:min-h-screen relative flex items-center justify-center p-6 lg:p-12 overflow-hidden hardware-accelerated"
        >
          {/* Static Warm Orange Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-[#D64B0F]" />

          {/* SINGLE Floating Logic Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [-5, 5, -5] }}
            transition={{
              opacity: { duration: 0.3, ease: "easeOut" },
              y: { duration: 6, ease: "easeInOut", repeat: Infinity }
            }}
            className="relative z-10 w-full max-w-[420px] hardware-accelerated"
          >
            <div className="bg-[#FFFFFF] rounded-3xl p-10 shadow-sm hover:-translate-y-[5px] hover:shadow-lg transition-all duration-200 ease-in-out relative hardware-accelerated group/card">

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[#F97316]">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-[28px] font-bold text-[#0F172A] mb-2 tracking-tight">Welcome Back</h3>
                <p className="text-[#64748B] font-medium">Secure your career path</p>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                {error && (
                  <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-sm font-semibold ml-1 block">Email</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-[#64748B] group-focus-within/input:text-[#F97316] transition-colors duration-200" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full bg-[#F8F9FB] border border-slate-200 text-[#0F172A] placeholder:text-slate-400 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#F97316] transition-colors duration-200 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 text-sm font-semibold ml-1 block">Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-[#64748B] group-focus-within/input:text-[#F97316] transition-colors duration-200" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8F9FB] border border-slate-200 text-[#0F172A] placeholder:text-slate-400 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#F97316] transition-colors duration-200 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <input type="checkbox" className="w-4 h-4 text-[#F97316] rounded border-slate-300 focus:ring-[#F97316] cursor-pointer transition-colors duration-200 group-hover/check:border-orange-400" />
                    <span className="text-[#64748B] text-sm font-medium transition-colors duration-200 group-hover/check:text-[#0F172A]">Remember me</span>
                  </label>
                  <a href="#" className="text-[#F97316] text-sm font-semibold hover:text-orange-600 hover:underline transition-all duration-200 underline-offset-4">Reset password?</a>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center bg-[#F97316] text-white py-4 rounded-xl font-bold text-base shadow-sm hover:scale-[1.03] hover:-translate-y-[2px] transition-all duration-200 ease-in-out hover:shadow-md hover:bg-orange-600 hardware-accelerated disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                    {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                  </button>
                  <button
                    type="button"
                    className="w-full bg-slate-50 text-slate-700 border border-slate-200 py-3.5 rounded-xl font-bold text-base hover:scale-[1.03] hover:-translate-y-[2px] hover:shadow-sm hover:bg-slate-100 transition-all duration-200 ease-in-out hardware-accelerated"
                  >
                    Request Access
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* New Logo Integration 3: Footer Branding */}
      <footer className="w-full relative z-20 bg-white border-t border-slate-200 py-8 px-8 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <Logo iconSize={32} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
        <p className="text-[#64748B] text-sm font-medium">© 2026 AI Placement. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
