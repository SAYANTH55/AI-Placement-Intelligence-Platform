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

  const navigate = useNavigate();

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

        {/* Right Section: Visual Hero */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="w-full lg:w-5/12 min-h-[60vh] lg:min-h-screen relative flex items-center justify-center p-6 lg:p-12 overflow-hidden hardware-accelerated"
        >
          {/* Static Warm Orange Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-[#D64B0F]" />

          {/* Premium UI Mockup Presentation */}
          <div className="relative z-10 w-full max-w-[500px] hardware-accelerated">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Main Dashboard Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl border border-white/20 hardware-accelerated">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="px-4 py-1.5 bg-orange-50 rounded-full text-[#F97316] text-[10px] font-bold uppercase tracking-wider">
                    AI Analysis Live
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-orange-50 rounded-3xl p-5 flex flex-col justify-end gap-2 border border-orange-100">
                      <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center text-white text-xs font-bold">94%</div>
                      <div className="text-[10px] font-bold text-[#F97316] uppercase tracking-tighter">Readiness Score</div>
                    </div>
                    <div className="h-32 bg-slate-50 rounded-3xl p-5 flex flex-col justify-end gap-2 border border-slate-100">
                      <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center text-white text-xs font-bold">2.4k</div>
                      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter">Growth Insights</div>
                    </div>
                  </div>
                  <div className="h-20 bg-slate-900 rounded-3xl p-5 flex items-center gap-4 border border-slate-800">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="h-3 w-28 bg-white/20 rounded-full mb-2" />
                      <div className="h-2 w-16 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl flex items-center justify-center"
              >
                 <Zap className="w-10 h-10 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-slate-800"
              >
                 <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-[10px] font-bold">12</div>
                 <div className="text-xs font-bold whitespace-nowrap">Career Matches Found</div>
              </motion.div>
            </motion.div>
          </div>
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
