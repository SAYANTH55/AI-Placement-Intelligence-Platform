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
    <div className="bg-[#F4EFE4] flex flex-col overflow-x-hidden relative font-inter selection:bg-sky-500/20 selection:text-orange-300 min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
        .hardware-accelerated { will-change: transform; transform: translateZ(0); }
      `}} />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(27,42,74,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(27,42,74,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1B2A4A]/3 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Decorative rotating ring */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
          className="absolute top-10 left-10 w-[500px] h-[500px] border border-[#1B2A4A]/8 rounded-full border-dashed hardware-accelerated"
        />
      </div>

      {/* Main Split Screen Area */}
      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">

        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-7/12 min-h-[80vh] flex flex-col justify-center pt-20 pb-40 px-8 lg:px-16 xl:px-24 relative hardware-accelerated"
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
              className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B2A4A]/10 border border-[#1B2A4A]/30 text-[#1B2A4A] text-sm font-bold cursor-default"
            >
              <Sparkles className="w-4 h-4" /> Smart Career Tracking
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl lg:text-7xl font-black text-[#1B2A4A] mb-6 tracking-tight leading-[1.05]"
            >
              Placement <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B2A4A] to-[#9ECCFA] drop-shadow-[0_0_20px_rgba(27,42,74,0.4)]">
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
                className="w-full sm:w-auto bg-[#1B2A4A] text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(27,42,74,0.3)] flex items-center justify-center gap-3 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(27,42,74,0.5)] hover:bg-[#1B2A4A] transition-all duration-200 group hardware-accelerated"
              >
                Access Platform
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/how-it-works')}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-[#1B2A4A] bg-[#f0ede5] border border-[#C9C2AF] flex justify-center items-center hover:scale-[1.03] hover:border-[#1B2A4A]/40 hover:shadow-[0_0_20px_rgba(27,42,74,0.1)] transition-all duration-200 hardware-accelerated"
              >
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Marquee */}
          <div className="absolute bottom-0 left-0 right-0 py-8 overflow-hidden bg-gradient-to-t from-[#f0ede5] to-transparent">
            <p className="text-[#333] text-xs font-black tracking-widest uppercase mb-4 px-8 lg:px-16">
              Trusted by Students from
            </p>
            <div className="flex group overflow-hidden">
              <div className="flex gap-16 px-8 whitespace-nowrap animate-scroll hardware-accelerated" style={{ paddingRight: '4rem', width: 'max-content' }}>
                {[...brands, ...brands].map((brand, i) => (
                  <span key={i} className="text-3xl font-extrabold text-[#d1c6b8] hover:text-[#1B2A4A]/60 transition-colors duration-200 cursor-default">
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
          className="w-full lg:w-5/12 min-h-[60vh] lg:min-h-screen relative flex items-center justify-center p-6 lg:p-12 hardware-accelerated"
        >
          {/* Light gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f7f5ef] to-[#edeae0]" />
          {/* Subtle neon glow layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B2A4A]/6 to-transparent" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(27,42,74,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(27,42,74,0.04)_1px,transparent_1px)] bg-[size:40px_40px] overflow-hidden" />

          {/* UI Mockup */}
          <div className="relative z-10 w-full max-w-[500px] hardware-accelerated">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              {/* Main Card */}
              <div className="bg-[#FFFFFF]/90 backdrop-blur-xl rounded-[40px] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-[#C9C2AF] hardware-accelerated animate-breathing">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className="px-4 py-1.5 bg-[#1B2A4A]/10 border border-[#1B2A4A]/30 rounded-full text-[#1B2A4A] text-[10px] font-bold uppercase tracking-wider">
                    AI Analysis Live
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-4 w-3/4 bg-[#C9C2AF] rounded-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-[#1B2A4A]/5 border border-[#1B2A4A]/20 rounded-3xl p-5 flex flex-col justify-end gap-2">
                      <div className="w-10 h-10 bg-[#1B2A4A] rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(27,42,74,0.5)]">94%</div>
                      <div className="text-[10px] font-bold text-[#1B2A4A] uppercase tracking-tighter">Readiness Score</div>
                    </div>
                    <div className="h-32 bg-[#FFFFFF] border border-[#C9C2AF] rounded-3xl p-5 flex flex-col justify-end gap-2">
                      <div className="w-10 h-10 bg-[#1B2A4A]/10 rounded-xl flex items-center justify-center text-[#1B2A4A] text-xs font-bold">2.4k</div>
                      <div className="text-[10px] font-bold text-[#888888] uppercase tracking-tighter">Growth Insights</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Floating badge top-right */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-[#1B2A4A]/10 backdrop-blur-md border border-[#1B2A4A]/30 rounded-3xl shadow-xl flex items-center justify-center shadow-[0_0_30px_rgba(27,42,74,0.2)]"
              >
                <Zap className="w-10 h-10 text-[#1B2A4A]" />
              </motion.div>

              {/* Floating badge bottom-left */}
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-[#FFFFFF] border border-[#1B2A4A]/20 text-[#1B2A4A] px-6 py-4 rounded-3xl shadow-[0_0_30px_rgba(27,42,74,0.1)] flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#1B2A4A] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(27,42,74,0.5)]">12</div>
                <div className="text-xs font-bold whitespace-nowrap text-[#888888555]">Career Matches Found</div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full relative z-20 bg-white border-t border-[#C9C2AF] py-8 px-8 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-6">
        <Logo iconSize={32} primaryText="text-xl" secondaryText="text-sm" gap="gap-3" />
        <p className="text-[#444] text-sm font-medium">© 2026 AI Placement. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
