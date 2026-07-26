import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, FileText, Zap, BrainCircuit, Target, Code, AlertTriangle, ShieldCheck, Trophy, FileSearch, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F4EFE4] flex flex-col overflow-x-hidden relative font-inter selection:bg-sky-500/20 selection:text-[#1B2A4A] min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
        .hardware-accelerated { will-change: transform; transform: translateZ(0); }
        .mask-grid { mask-image: radial-gradient(ellipse at center, black 10%, transparent 80%); -webkit-mask-image: radial-gradient(ellipse at center, black 10%, transparent 80%); }
        .dashed-border-animated { stroke-dasharray: 8, 8; animation: dash 20s linear infinite; }
        @keyframes dash { to { stroke-dashoffset: -100; } }
      `}} />

      {/* Background Grids & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(27,42,74,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(27,42,74,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 mask-grid opacity-70" />
      
      {/* Soft blurred radial gradient behind headline */}
      <div className="absolute top-10 left-10 w-[600px] h-[600px] bg-[#1B2A4A]/[0.02] rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
      {/* Soft blurred radial gradient behind dashboard */}
      <div className="absolute top-20 right-10 w-[700px] h-[700px] bg-[#3B82F6]/[0.03] rounded-full blur-[140px] pointer-events-none z-0 mix-blend-multiply" />

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row min-h-screen relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 pt-20 pb-16 lg:py-0">
        
        {/* Left Column: Composition & Credibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-[50%] flex flex-col justify-center pt-8 pb-12 lg:py-32 hardware-accelerated relative z-20"
        >
          <div className="max-w-[540px]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
              <Logo iconSize={24} primaryText="text-sm font-bold" secondaryText="text-[10px]" gap="gap-2" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 text-[#1B2A4A]/80 text-[12px] font-bold tracking-wide uppercase cursor-default">
              <Sparkles className="w-3.5 h-3.5" /> Smart Career Tracking
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="text-[42px] sm:text-[52px] md:text-[64px] lg:text-[76px] font-black text-[#1B2A4A] mb-6 tracking-tight leading-[1.05]">
              Placement <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B2A4A] to-[#4b79be] drop-shadow-[0_2px_10px_rgba(27,42,74,0.1)]">
                Intelligence
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-[17px] text-[#1B2A4A]/70 mb-10 leading-relaxed font-medium max-w-[460px]">
              Bridge the gap between student potential and industry demand. AI-powered resume analysis, placement readiness prediction, and personalized career intelligence.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center gap-5 mb-12">
              <button onClick={() => navigate('/login')} className="bg-[#1B2A4A] text-white px-8 py-3.5 rounded-[12px] font-bold text-[15px] shadow-[0_8px_20px_rgba(27,42,74,0.15)] flex items-center justify-center hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(27,42,74,0.25)] transition-all duration-200 hardware-accelerated">
                Analyze Resume
              </button>
              <button onClick={() => navigate('/how-it-works')} className="px-6 py-3.5 rounded-[12px] font-semibold text-[15px] text-[#1B2A4A]/70 flex justify-center items-center gap-2 hover:text-[#1B2A4A] hover:bg-[#1B2A4A]/5 transition-all duration-200 hardware-accelerated group">
                View Demo <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </button>
            </motion.div>
            
            {/* Immediate Credibility Feature Pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="flex flex-wrap gap-x-6 gap-y-3 max-w-[480px]">
              {[
                { icon: <FileSearch size={14} />, text: 'ATS Analysis' },
                { icon: <Target size={14} />, text: 'Role Prediction' },
                { icon: <BrainCircuit size={14} />, text: 'AI Recommendations' },
                { icon: <LineChart size={14} />, text: 'Career Roadmap' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-[#1B2A4A]/60">
                  <div className="w-5 h-5 rounded-full bg-[#1B2A4A]/5 flex items-center justify-center text-[#1B2A4A]/70">{feature.icon}</div>
                  <span className="text-[13px] font-semibold">{feature.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Column: The Visual Pipeline Narrative */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full lg:w-[50%] flex items-center justify-center relative hardware-accelerated h-full mt-20 lg:mt-0"
        >
          {/* Main Visual Anchor (The Engine) */}
          <div className="relative w-full max-w-[500px] h-[550px] flex items-center justify-center">
            
            {/* Background connection lines */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ filter: 'drop-shadow(0px 2px 4px rgba(27,42,74,0.05))' }}>
              <path d="M 120 150 C 250 150, 250 250, 250 250" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeOpacity="0.1" className="dashed-border-animated" />
              <path d="M 250 350 C 250 450, 150 450, 150 450" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeOpacity="0.1" className="dashed-border-animated" />
              <path d="M 380 250 C 380 350, 250 350, 250 350" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeOpacity="0.1" className="dashed-border-animated" />
            </svg>

            {/* Central Dashboard Card */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100 }}
              className="absolute z-10 w-full max-w-[320px] bg-[#FFFFFF]/95 backdrop-blur-md rounded-[24px] shadow-[0_24px_60px_rgba(27,42,74,0.08)] border border-[#1B2A4A]/5 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1B2A4A]/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1B2A4A]/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1B2A4A]/10" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md">
                  <Zap size={10} className="fill-current animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">AI Processing</span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-[#1B2A4A]/40 uppercase tracking-widest mb-2">Input Source</p>
                  <div className="flex items-center gap-3 bg-[#F4EFE4]/30 p-2.5 rounded-xl border border-[#1B2A4A]/5">
                     <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center"><FileText size={14} className="text-[#1B2A4A]" /></div>
                     <div>
                       <p className="text-[12px] font-bold text-[#1B2A4A]">Resume_Aarav.pdf</p>
                       <p className="text-[10px] font-medium text-[#1B2A4A]/50">Uploaded just now</p>
                     </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-[#1B2A4A]/40 uppercase tracking-widest mb-2">Extracted Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {['Python', 'FastAPI', 'TensorFlow', 'React'].map((skill, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + (i * 0.1) }}
                        key={skill} 
                        className="px-2.5 py-1 bg-[#1B2A4A]/5 rounded-lg text-[11px] font-semibold text-[#1B2A4A]/80 border border-[#1B2A4A]/5"
                      >
                        {skill}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-[#1B2A4A]/40 uppercase tracking-widest mb-2">Missing Capabilities</p>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex flex-col gap-1.5"
                  >
                     <div className="flex items-center gap-2 text-[11px] font-medium text-[#1B2A4A]/70"><AlertTriangle size={12} className="text-amber-500" /> Docker / Kubernetes</div>
                     <div className="flex items-center gap-2 text-[11px] font-medium text-[#1B2A4A]/70"><AlertTriangle size={12} className="text-amber-500" /> Advanced System Design</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Top Left Floating Satellite: ATS Score */}
            <motion.div 
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="absolute z-20 left-0 sm:-left-6 top-16 bg-white p-4 rounded-[20px] shadow-[0_12px_30px_rgba(27,42,74,0.08)] border border-[#1B2A4A]/5 w-[140px] sm:w-[160px] hardware-accelerated transition-transform scale-90 sm:scale-100 origin-top-left"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 mb-3 flex items-center justify-center"><ShieldCheck size={16} className="text-emerald-500" /></div>
              <p className="text-[11px] font-bold text-[#1B2A4A]/40 uppercase tracking-widest mb-1">ATS Score</p>
              <p className="text-3xl font-black text-[#1B2A4A]">94<span className="text-sm text-[#1B2A4A]/40">/100</span></p>
            </motion.div>

            {/* Bottom Right Floating Satellite: Readiness */}
            <motion.div 
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="absolute z-20 right-0 sm:-right-4 bottom-16 bg-[#1B2A4A] p-5 rounded-[24px] shadow-[0_20px_40px_rgba(27,42,74,0.2)] border border-white/10 w-[160px] sm:w-[180px] hardware-accelerated transition-transform scale-90 sm:scale-100 origin-bottom-right"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Trophy size={14} className="text-amber-400" /></div>
                 <div className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">High</div>
              </div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Placement Score</p>
              <p className="text-3xl font-black text-white">91<span className="text-sm text-white/50">%</span></p>
            </motion.div>

            {/* Bottom Left Satellite: Role Prediction */}
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="absolute z-20 left-0 sm:left-4 -bottom-6 bg-white px-4 sm:px-5 py-4 rounded-[20px] shadow-[0_12px_30px_rgba(27,42,74,0.06)] border border-[#1B2A4A]/5 flex items-center gap-4 hardware-accelerated transition-transform scale-90 sm:scale-100 origin-bottom-left"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Code size={18} className="text-indigo-500" /></div>
              <div>
                <p className="text-[10px] font-bold text-[#1B2A4A]/40 uppercase tracking-widest mb-0.5">Predicted Role</p>
                <p className="text-[14px] font-bold text-[#1B2A4A]">Backend Engineer</p>
              </div>
            </motion.div>

            {/* Small Floating Pill Top Right */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.7, type: "spring" }}
              className="absolute z-30 top-10 right-0 sm:right-4 bg-white px-4 py-2.5 rounded-full shadow-lg border border-[#1B2A4A]/5 flex items-center gap-2 hardware-accelerated scale-90 sm:scale-100 origin-top-right"
            >
              <div className="w-4 h-4 rounded-full bg-[#1B2A4A] flex items-center justify-center text-[9px] font-bold text-white">12</div>
              <span className="text-[11px] font-bold text-[#1B2A4A]/70">Career Matches</span>
            </motion.div>

          </div>
        </motion.div>

      </div>

      {/* Footer */}
      <footer className="w-full relative z-20 bg-transparent py-8 px-6 lg:px-12 flex flex-col sm:flex-row gap-4 justify-between items-center max-w-7xl mx-auto border-t border-[#1B2A4A]/5">
        <Logo iconSize={24} primaryText="text-sm font-bold opacity-60" secondaryText="hidden" gap="gap-2" />
        <p className="text-[#1B2A4A]/40 text-[12px] font-medium">© 2026 AI Placement. Built for scale.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
