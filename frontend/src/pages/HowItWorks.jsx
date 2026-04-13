import React, { useRef, useEffect, useState } from 'react';
import { Upload, Cpu, BarChart2, Rocket, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from 'framer-motion';

const steps = [
  {
    icon: <Upload size={32} />,
    step: '01',
    title: 'Upload Your Resume',
    tag: 'INPUT',
    desc: 'Simply drag and drop your PDF or DOCX resume into our secure upload portal. Takes less than 10 seconds — no account needed to try.',
    stat: '< 10s',
    statLabel: 'to upload',
  },
  {
    icon: <Cpu size={32} />,
    step: '02',
    title: 'AI Parses & Analyzes',
    tag: 'PROCESS',
    desc: 'Our NLP engine instantly extracts your skills, experience, and education — cross-referencing against 50,000+ real placement data points.',
    stat: '50K+',
    statLabel: 'data points',
  },
  {
    icon: <BarChart2 size={32} />,
    step: '03',
    title: 'Intelligence Report',
    tag: 'OUTPUT',
    desc: 'Receive a comprehensive score, skill gap breakdown, target role recommendations, and a personalized learning roadmap — all in one view.',
    stat: '360°',
    statLabel: 'career view',
  },
  {
    icon: <Rocket size={32} />,
    step: '04',
    title: 'Accelerate Your Career',
    tag: 'LAUNCH',
    desc: 'Follow the guided learning path, close your skill gaps, and apply to the best-matched companies — with confidence backed by data.',
    stat: '3×',
    statLabel: 'faster growth',
  },
];

// Custom cursor magnetic component
function MagneticCard({ children, className, style }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-50, 50], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-50, 50], [-8, 8]), { stiffness: 300, damping: 30 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouse(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      className={className}
    >
      {/* Cursor glow effect inside card */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: `radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(249,115,22,0.07), transparent 60%)`,
        }}
      />
      <div style={{ transform: 'translateZ(30px)' }} className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// Individual step card with scroll reveal
function StepCard({ step, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-15% 0px -15% 0px' });

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -80 : 80, y: 20 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className={`flex items-center gap-8 lg:gap-20 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Card */}
      <div className="flex-1 group" style={{ perspective: 1000 }}>
        <MagneticCard className="relative bg-[#0A0A0A] border border-[#1E1E1E] rounded-[2rem] p-8 lg:p-10 shadow-2xl cursor-pointer overflow-hidden">
          {/* Neon orange top border accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F97316] to-transparent opacity-80" />

          {/* Step tag */}
          <div className="flex items-center justify-between mb-8">
            <span className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
              {step.tag}
            </span>
            <span className="font-black text-[#1A1A1A] text-5xl font-mono tracking-tighter select-none">
              {step.step}
            </span>
          </div>

          {/* Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]">
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-white font-black text-2xl lg:text-3xl mb-4 leading-tight tracking-tight">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-[#888] text-sm lg:text-base leading-loose">
            {step.desc}
          </p>

          {/* Stat Pill */}
          <div className="mt-8 inline-flex items-center gap-3 bg-[#F97316]/5 border border-[#F97316]/20 rounded-2xl px-5 py-3">
            <span className="text-[#F97316] font-black text-2xl">{step.stat}</span>
            <span className="text-[#666] text-xs uppercase tracking-widest">{step.statLabel}</span>
          </div>

          {/* Bottom glow */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#F97316]/10 blur-3xl rounded-full pointer-events-none" />
        </MagneticCard>
      </div>

      {/* Step Number + Connector Node (center spine) */}
      <div className="hidden lg:flex flex-col items-center flex-shrink-0 w-20 gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 400 }}
          className="w-14 h-14 rounded-full border-2 border-[#F97316] bg-[#0A0A0A] flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.4)] z-10"
        >
          <span className="text-[#F97316] font-black text-sm font-mono">{step.step}</span>
        </motion.div>
      </div>

      {/* Spacer for alternating layout */}
      <div className="flex-1 hidden lg:block" />
    </motion.div>
  );
}

export default function HowItWorks() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const lineRef = useRef(null);

  // Scroll-driven neon light beam
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 20%'],
  });

  const lightBeamY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const lightBeamOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);
  const smoothBeamY = useSpring(lightBeamY, { stiffness: 60, damping: 20 });

  // Cursor tracking for global glow
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isOnPage, setIsOnPage] = useState(false);

  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#060606] overflow-hidden py-24 px-4 sm:px-8"
      onMouseEnter={() => setIsOnPage(true)}
      onMouseLeave={() => setIsOnPage(false)}
    >
      {/* Global cursor neon glow that follows mouse */}
      {isOnPage && (
        <div
          className="absolute pointer-events-none z-0 w-[800px] h-[800px] rounded-full transition-all duration-300"
          style={{
            left: cursor.x - 400,
            top: cursor.y - 400,
            background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Top vignette fade */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#060606] to-transparent pointer-events-none z-10" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-32"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-[0.3em] px-5 py-2.5 rounded-full mb-8"
          >
            <Zap size={12} className="fill-[#F97316]" />
            The Pipeline
          </motion.span>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight leading-none">
            How It{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FF8C3A] drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]">
              Works
            </span>
          </h1>

          <p className="text-[#666] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Four simple steps from raw resume to career-ready intelligence.
            Our AI handles everything in seconds.
          </p>

          {/* Scroll hint */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="mt-16 flex flex-col items-center gap-2 text-[#444] text-xs tracking-widest uppercase"
          >
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#F97316]/50" />
            <span>Scroll to explore</span>
          </motion.div>
        </motion.div>

        {/* Steps with scroll-driven neon spine */}
        <div ref={lineRef} className="relative">

          {/* The backbone vertical line */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-[#1A1A1A]" />

          {/* NEON LIGHT BEAM — travels down the spine as you scroll */}
          <motion.div
            className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[3px] pointer-events-none z-20"
            style={{
              top: 0,
              height: smoothBeamY,
              opacity: lightBeamOpacity,
              background: 'linear-gradient(to bottom, transparent, #F97316, #FF8C3A)',
              boxShadow: '0 0 12px 4px rgba(249,115,22,0.6), 0 0 40px 10px rgba(249,115,22,0.2)',
              maxHeight: '100%',
            }}
          />

          {/* Traveling NEON DOT at the tip of the beam */}
          <motion.div
            className="hidden lg:absolute lg:block left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#F97316] -translate-x-[14px] z-30 pointer-events-none"
            style={{
              top: smoothBeamY,
              opacity: lightBeamOpacity,
              boxShadow: '0 0 20px 8px rgba(249,115,22,0.8), 0 0 60px 20px rgba(249,115,22,0.3)',
            }}
          />

          {/* Steps */}
          <div className="space-y-24 lg:space-y-32">
            {steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-40 text-center relative"
        >
          {/* Glow behind button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-[#F97316]/15 blur-[60px] rounded-full pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 relative">
            Ready to launch?
          </h2>
          <p className="text-[#555] mb-10 text-lg relative">No credit card · Results in under 5 seconds.</p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(249,115,22,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="relative inline-flex items-center gap-3 bg-[#F97316] text-white font-black text-lg px-12 py-5 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:bg-orange-500 transition-colors duration-200"
          >
            Try It Now — It's Free
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom vignette fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#060606] to-transparent pointer-events-none z-10" />
    </div>
  );
}
