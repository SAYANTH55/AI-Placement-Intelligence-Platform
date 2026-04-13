import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Logo from '../components/Logo';

const brands = ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Accenture", "IBM", "Deloitte"];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#060606] flex flex-col overflow-x-hidden relative font-inter selection:bg-orange-500/20 selection:text-orange-300 min-h-screen">

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll { animation: scroll 25s linear infinite; }
        .group:hover .animate-scroll { animation-play-state: paused; }
        .hardware-accelerated { will-change: transform; transform: translateZ(0); }
      `}} />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#F97316]/3 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Decorative rotating ring */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
          className="absolute top-10 left-10 w-[500px] h-[500px] border border-[#F97316]/8 rounded-full border-dashed hardware-accelerated"
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 z-50 px-6 py-6 hardware-accelerated"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur-xl border border-[#1E1E1E] px-8 py-4 rounded-full shadow-[0_4px_30px_rgba(249,115,22,0.08)]">
          <Logo iconSize={36} primaryText="text-xl" secondaryText="text-sm hidden lg:block" gap="gap-3" />

          <div className="hidden lg:flex items-center gap-10 font-medium text-[#888]">
            {[
              { label: 'Home', path: '/' },
              { label: 'Features', path: '/features' },
              { label: 'How it Works', path: '/how-it-works' },
              { label: 'Contact', path: '/contact' },
            ].map(({ label, path }, i) => (
              <button
                key={i}
                onClick={() => navigate(path)}
                className="relative group hover:text-white transition-colors duration-200 bg-transparent border-none cursor-pointer font-medium text-[#888]"
              >
                {label}
                <span className="absolute -bottom-1.5 left-0 w-full h-0.5 bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)] origin-left scale-x-0 transition-transform duration-200 ease-in-out group-hover:scale-x-100 rounded-full hardware-accelerated" />
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/login')}
            className="hidden lg:flex items-center gap-2 bg-[#F97316] text-white px-6 py-2.5 rounded-full font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-200 ease-in-out hardware-accelerated"
          >
            Start Hub
            <Zap className="w-4 h-4 text-white fill-white" />
          </button>
        </div>
      </motion.nav>

      {/* Main Split Screen Area */}
      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">

        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-7/12 min-h-[90vh] flex flex-col justify-center pt-36 pb-40 px-8 lg:px-16 xl:px-24 relative hardware-accelerated"
        >
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <Logo iconSize={28} primaryText="text-base" secondaryText="text-xs" gap="gap-2" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-sm font-bold cursor-default"
            >
              <Sparkles className="w-4 h-4" /> Smart Career Tracking
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.05]"
            >
              Placement <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FF8C3A] drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg lg:text-xl text-[#666] mb-10 leading-relaxed font-medium max-w-xl"
            >
              Bridge the gap between ambition and industry demand. Transform raw resumes into highly accurate, AI-driven career roadmaps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-[#F97316] text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] hover:bg-orange-500 transition-all duration-200 group hardware-accelerated"
              >
                Access Platform
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/how-it-works')}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-white bg-[#0F0F0F] border border-[#2A2A2A] flex justify-center items-center hover:scale-[1.03] hover:border-[#F97316]/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all duration-200 hardware-accelerated"
              >
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Marquee */}
          <div className="absolute bottom-0 left-0 right-0 py-8 overflow-hidden bg-gradient-to-t from-[#080808] to-transparent">
            <p className="text-[#333] text-xs font-black tracking-widest uppercase mb-4 px-8 lg:px-16">
              Trusted by Students from
            </p>
            <div className="flex group overflow-hidden">
              <div className="flex gap-16 px-8 whitespace-nowrap animate-scroll hardware-accelerated" style={{ paddingRight: '4rem', width: 'max-content' }}>
                {[...brands, ...brands].map((brand, i) => (
                  <span key={i} className="text-3xl font-extrabold text-[#1E1E1E] hover:text-[#F97316]/60 transition-colors duration-200 cursor-default">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Section */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="w-full lg:w-5/12 min-h-[60vh] lg:min-h-screen relative flex items-center justify-center p-6 lg:p-12 overflow-hidden hardware-accelerated"
        >
          {/* Dark orange gradient bg - deeper and less orange bleed */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D0500] via-[#150800] to-[#060606]" />
          {/* Subtle neon glow layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/6 to-transparent" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* UI Mockup */}
          <div className="relative z-10 w-full max-w-[500px] hardware-accelerated">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              {/* Main Card */}
              <div className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-[40px] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-[#1E1E1E] hardware-accelerated">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className="px-4 py-1.5 bg-[#F97316]/10 border border-[#F97316]/30 rounded-full text-[#F97316] text-[10px] font-bold uppercase tracking-wider">
                    AI Analysis Live
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-4 w-3/4 bg-[#1A1A1A] rounded-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-[#F97316]/5 border border-[#F97316]/20 rounded-3xl p-5 flex flex-col justify-end gap-2">
                      <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.5)]">94%</div>
                      <div className="text-[10px] font-bold text-[#F97316] uppercase tracking-tighter">Readiness Score</div>
                    </div>
                    <div className="h-32 bg-[#111] border border-[#1E1E1E] rounded-3xl p-5 flex flex-col justify-end gap-2">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white text-xs font-bold">2.4k</div>
                      <div className="text-[10px] font-bold text-[#555] uppercase tracking-tighter">Growth Insights</div>
                    </div>
                  </div>
                  <div className="h-20 bg-[#111] border border-[#1E1E1E] rounded-3xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <div>
                      <div className="h-3 w-28 bg-white/10 rounded-full mb-2" />
                      <div className="h-2 w-16 bg-white/5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge top-right */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-[#F97316]/10 backdrop-blur-md border border-[#F97316]/30 rounded-3xl shadow-xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.2)]"
              >
                <Zap className="w-10 h-10 text-[#F97316]" />
              </motion.div>

              {/* Floating badge bottom-left */}
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-[#0A0A0A] border border-[#F97316]/20 text-white px-6 py-4 rounded-3xl shadow-[0_0_30px_rgba(249,115,22,0.1)] flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]">12</div>
                <div className="text-xs font-bold whitespace-nowrap text-[#ccc]">Career Matches Found</div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full relative z-20 bg-[#080808] border-t border-[#1A1A1A] py-8 px-8 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-6">
        <Logo iconSize={32} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
        <p className="text-[#444] text-sm font-medium">© 2026 AI Placement. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
