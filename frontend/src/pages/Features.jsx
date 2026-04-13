import React, { useState, useEffect } from 'react';
import { Brain, Target, BarChart3, Map, Zap, Shield, ArrowRight, CornerRightDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  { id: 1, icon: <Brain />, title: 'Resume Parsing', desc: 'State-of-the-art NLP extracts skills, experience, and achievements from any format instantly.' },
  { id: 2, icon: <Target />, title: 'Skill Detection', desc: 'Automatically identifies missing competencies against thousands of real job requirements.' },
  { id: 3, icon: <BarChart3 />, title: 'Placement Score', desc: 'A dynamic readiness score updated in real-time as your profile and the job market shifts.' },
  { id: 4, icon: <Map />, title: 'Career Roadmap', desc: 'Get a personalized, step-by-step learning path to bridge gaps and accelerate your journey.' },
  { id: 5, icon: <Zap />, title: 'Instant Analysis', desc: 'Results in seconds — no waiting. Our pipeline processes and cross-references 50,000+ data points.' },
  { id: 6, icon: <Shield />, title: 'Private & Secure', desc: 'Your data never leaves. Full privacy-first architecture protecting your data from day one.' }
];

export default function Features() {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [autoIndex, setAutoIndex] = useState(0);

  // Auto loop through features text when not hovering
  useEffect(() => {
    if (hoveredNode !== null) return;
    
    const timer = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % features.length);
    }, 2500);
    
    return () => clearInterval(timer);
  }, [hoveredNode]);

  const isHoveredState = hoveredNode !== null;
  const activeIndex = hoveredNode !== null ? hoveredNode : autoIndex;
  const activeFeature = features[activeIndex];

  // Map coordinates in our 1000x500 precise 2:1 SVG Space
  const nodeCenters = [
     { x: 100, y: 100 },
     { x: 260, y: 100 },
     { x: 420, y: 100 },
     { x: 580, y: 100 },
     { x: 740, y: 100 },
     { x: 900, y: 100 },
  ];
  
  // The central intelligence hub where data converges down into
  const hubPos = { x: 500, y: 380 };

  const generatePath = (start, end) => {
    return `M ${start.x} ${start.y} C ${start.x} ${(start.y + end.y) * 0.6}, ${end.x} ${(start.y + end.y) * 0.4}, ${end.x} ${end.y - 40}`;
  };

  return (
    <div className="min-h-screen bg-[#060606] text-gray-900 py-24 font-sans flex flex-col justify-center overflow-hidden relative">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative">

        {/* Floating background glow to highlight the platform area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-400/10 blur-[100px] rounded-[100%] pointer-events-none" />

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 relative z-10"
        >
          <span className="inline-flex items-center gap-2 bg-[#F97316]/10 text-[#F97316] text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full mb-6 border border-[#F97316]/30 shadow-sm">
            <CornerRightDown size={14} className="text-orange-500" /> Pipeline Architecture
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            Data-Driven <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">Intelligence Core</span>
          </h1>
          <p className="text-[#666] text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            All incoming profiles are actively captured, classified, and indexed through our 6-node convergence layer to generate unified placement metrics in real-time.
          </p>
        </motion.div>

        {/* Pipeline Funnel Visualization wrapped in a 3D Platform base */}
        <div className="w-full overflow-x-auto pb-10 hide-scrollbar px-4 relative z-10 perspective-1000">
          
          {/* Outer Platform / Pedestal */}
          <div 
            className="p-3 sm:p-6 rounded-[2.5rem] bg-[#0A0A0A]/60 border border-[#1E1E1E] shadow-[0_40px_100px_-20px_rgba(249,115,22,0.2)] relative max-w-[1050px] mx-auto min-w-[900px]"
            style={{ backdropFilter: 'blur(12px)', transformStyle: "preserve-3d" }}
          >
            {/* The Actual Diagram Container */}
            <div className="relative w-full aspect-[16/9] md:aspect-[2/1] bg-[#080808] rounded-[2rem] border border-[#1A1A1A] shadow-[inset_0_2px_20px_rgba(0,0,0,0.3)] overflow-hidden">
              
              {/* SVG Draw Layer completely separated from DOM Flow */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="solid-line" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Base Structural Lines (Always present, subtle grey) */}
                {nodeCenters.map((pos, i) => (
                  <path
                    key={`base-${i}`}
                    d={generatePath(pos, hubPos)}
                    fill="none"
                    stroke="#1E2226"
                    strokeWidth="2"
                  />
                ))}

                {/* Dynamic Connecting Lines & Tracers */}
                {nodeCenters.map((pos, i) => {
                  const isTracerActive = !isHoveredState || hoveredNode === i;
                  const isSolidActive = isHoveredState ? (hoveredNode === i) : (activeIndex === i);

                  return (
                    <React.Fragment key={`dynamic-lines-${i}`}>
                      {/* Active Connection Line (Thick, glowing gradient) */}
                      <motion.path
                        d={generatePath(pos, hubPos)}
                        fill="none"
                        stroke="url(#solid-line)"
                        strokeWidth="4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: isSolidActive ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />

                      {/* The "Data Packet" Tracer animation */}
                      {isTracerActive && (
                        <motion.path
                          d={generatePath(pos, hubPos)}
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="4"
                          strokeLinecap="round"
                          style={{ filter: 'drop-shadow(0px 0px 8px rgba(249,115,22,0.8))' }}
                          initial={{ pathLength: 0.15, pathOffset: 0, opacity: 0 }}
                          animate={{ pathOffset: [0, 1], opacity: [0, 1, 1, 0] }}
                          transition={{ 
                            pathOffset: { duration: 1.8, repeat: Infinity, ease: "linear", delay: isHoveredState ? 0 : (i % 3) * 0.4 },
                            opacity: { duration: 1.8, repeat: Infinity, ease: "linear", delay: isHoveredState ? 0 : (i % 3) * 0.4 }
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </svg>

              {/* DOM Overlay logic mapping cleanly to SVG Coordinates */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                
                {/* TOP NODES (The 6 AI Functions) */}
                {features.map((f, i) => {
                  const pos = nodeCenters[i];
                  const top = (pos.y / 500) * 100;
                  const left = (pos.x / 1000) * 100;
                  const isNodeFocused = i === activeIndex;

                  return (
                    <div 
                      key={f.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center group cursor-pointer"
                      style={{ top: `${top}%`, left: `${left}%` }}
                      onMouseEnter={() => setHoveredNode(i)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Floating Node Label */}
                      <div className={`absolute -top-10 font-black uppercase tracking-[0.15em] text-[10px] md:text-[11px] whitespace-nowrap transition-all duration-300 ${isNodeFocused ? 'text-orange-500 scale-110' : 'text-gray-400'}`}>
                        {f.title.replace(' ', '\n').split('\n')[0]}
                      </div>
                      
                      {/* Node Circle */}
                      <motion.div 
                        layout
                        animate={{ 
                          scale: isNodeFocused ? 1.2 : 1,
                          backgroundColor: isNodeFocused ? '#F97316' : '#FFFFFF',
                          boxShadow: isNodeFocused ? '0 10px 25px -5px rgba(249,115,22,0.4), 0 8px 10px -6px rgba(249,115,22,0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                        }}
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 ${isNodeFocused ? 'border-orange-500' : 'border-gray-100 group-hover:border-orange-200'}`}
                      >
                        {React.cloneElement(f.icon, { 
                          size: 24, 
                          className: `transition-colors duration-300 ${isNodeFocused ? "text-white" : "text-gray-400 group-hover:text-orange-400"}` 
                        })}
                      </motion.div>
                      
                      {/* Ring indicator around active node */}
                      {isNodeFocused && (
                        <motion.div 
                          initial={{ scale: 1, opacity: 0.8 }}
                          animate={{ scale: 1.6, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                          className="absolute w-16 h-16 rounded-full border border-orange-500 pointer-events-none"
                        />
                      )}
                    </div>
                  );
                })}

                {/* CENTRAL PROCESSING HUB */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-[45%] flex flex-col items-center pointer-events-auto w-[85%] sm:w-[420px]"
                  style={{ top: `${(hubPos.y / 500) * 100}%`, left: `${(hubPos.x / 1000) * 100}%` }}
                >
                  <motion.div 
                    className="relative w-full bg-[#0A0A0A] p-8 sm:p-10 rounded-[2.5rem] border border-[#1E1E1E] shadow-[0_20px_50px_-15px_rgba(249,115,22,0.2)] flex flex-col items-center text-center overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                    layoutId="hubContainer"
                  >
                    {/* Notch where lines connect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-orange-500 shadow-[0_0_15px_#F97316]" />
                    
                    {/* Dynamic Content crossfade */}
                    <div className="w-full h-32 flex flex-col justify-center items-center mb-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeFeature.id}
                          initial={{ y: 5, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -5, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <span className="text-orange-500 font-black tracking-[0.2em] text-xs sm:text-sm mb-4 uppercase inline-block">
                             [ {activeFeature.title} ]
                          </span>
                          <p className="text-[#888] font-medium text-sm sm:text-base leading-relaxed">
                             {activeFeature.desc}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    <button
                       onClick={() => navigate('/login')}
                       className="w-full inline-flex justify-center items-center gap-3 bg-[#F97316] text-white font-bold tracking-wide px-8 py-4 rounded-2xl hover:bg-orange-600 hover:shadow-[0_10px_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
                     >
                       Initiate Extraction
                       <ArrowRight size={18} />
                     </button>
                  </motion.div>

                  {/* Number indicator styled under the hub */}
                  <div className="mt-6 flex flex-col items-center opacity-60">
                    <div className="w-px h-6 bg-orange-300 mb-2"></div>
                    <div className="w-10 h-10 rounded-full border-2 border-[#F97316]/30 bg-[#0A0A0A] flex items-center justify-center text-[#F97316] font-black font-mono text-sm shadow-sm transition-opacity duration-300">
                      0{activeIndex + 1}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
