import { useState, useRef, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Send, CheckCircle, ArrowRight } from 'lucide-react';
import {
  motion, useMotionValue, useSpring, useTransform,
  AnimatePresence, useInView
} from 'framer-motion';

/* ─────────────────── Floating Particle ─────────────────── */
function Particle({ x, y, delay }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-[#1B2A4A] pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
        y: [0, -60, -120],
      }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

/* ─────────────────── Animated Orbit Ring ─────────────────── */
function OrbitRing({ radius, duration, reverse, dotColor }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: radius * 2, height: radius * 2,
        marginLeft: -radius, marginTop: -radius,
        border: '1px solid rgba(27,42,74,0.08)',
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {/* dot on the ring */}
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{ background: dotColor, top: 0, left: '50%', marginLeft: -4, marginTop: -4,
          boxShadow: `0 0 10px 4px ${dotColor}` }}
      />
    </motion.div>
  );
}

/* ─────────────────── Magnetic Card ─────────────────── */
function MagCard({ children, className }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-40, 40], [6, -6]), { stiffness: 300, damping: 30 });
  const ry = useSpring(useTransform(x, [-60, 60], [-6, 6]), { stiffness: 300, damping: 30 });
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  function onMove(e) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(e.clientX - r.left - r.width / 2);
    y.set(e.clientY - r.top - r.height / 2);
    glowX.set(e.clientX - r.left);
    glowY.set(e.clientY - r.top);
  }
  function onLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      className={className}
    >
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) => `radial-gradient(380px circle at ${gx}px ${gy}px, rgba(27,42,74,0.06), transparent 70%)`
          ),
        }}
      />
      <div style={{ transform: 'translateZ(20px)' }} className="relative z-10 h-full flex items-center gap-4">
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────── Glitch Text ─────────────────── */
function GlitchText({ text, className }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      {text}
      {glitch && (
        <>
          <span className="absolute inset-0 text-[#1B2A4A] translate-x-1 opacity-70" aria-hidden>{text}</span>
          <span className="absolute inset-0 text-cyan-400 -translate-x-1 opacity-50" aria-hidden>{text}</span>
        </>
      )}
    </span>
  );
}

/* ─────────────────── Animated Input ─────────────────── */
function AnimInput({ label, name, type = 'text', value, onChange, placeholder, multiline }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const Tag = multiline ? 'textarea' : 'input';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-2">{label}</label>
      <div className="relative">
        <Tag
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={multiline ? 5 : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-[#FFFFFF] border text-[#1B2A4A] rounded-2xl px-5 py-4 text-sm placeholder:text-[#888888] focus:outline-none transition-all duration-300 resize-none ${
            focused ? 'border-[#1B2A4A]/60 shadow-[0_0_20px_rgba(27,42,74,0.12)]' : 'border-[#C9C2AF]'
          }`}
          required
        />
        {/* scanning line on focus */}
        <AnimatePresence>
          {focused && (
            <motion.div
              key="scan"
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1B2A4A] to-transparent pointer-events-none"
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─────────────────── Contact Page ─────────────────── */
const particles = Array.from({ length: 25 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100, delay: Math.random() * 4, id: i
}));

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const heroRef = useRef(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  };

  const contacts = [
    { icon: <Mail size={20} />, label: 'Email', value: 'contact@aiplacement.io', accent: '#3B82F6' },
    { icon: <MessageSquare size={20} />, label: 'Support', value: 'Available 9am–6pm IST', accent: '#22C55E' },
    { icon: <MapPin size={20} />, label: 'Location', value: 'Bengaluru, India', accent: '#1B2A4A' },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFE4] overflow-hidden relative" style={{ perspective: '1200px' }}>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} delay={p.delay} />)}
      </div>

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(27,42,74,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(27,42,74,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />

      {/* ── Orbit rings ── */}
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 pointer-events-none z-0 w-0 h-0">
        <OrbitRing radius={260} duration={22} dotColor="#1B2A4A" />
        <OrbitRing radius={380} duration={34} reverse dotColor="rgba(27,42,74,0.4)" />
        <OrbitRing radius={480} duration={50} dotColor="rgba(27,42,74,0.2)" />
      </div>

      {/* ── Hero header ── */}
      <div className="relative z-10 text-center pt-24 pb-20 px-4" ref={heroRef}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 mb-8 bg-[#1B2A4A]/10 border border-[#1B2A4A]/30 text-[#1B2A4A] text-[11px] font-black uppercase tracking-[0.35em] px-6 py-3 rounded-full"
        >
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-2 h-2 rounded-full bg-[#1B2A4A] inline-block"
          />
          Direct Line Open
        </motion.div>

        {/* Main heading with glitch */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl sm:text-8xl font-black text-[#1B2A4A] tracking-tight leading-none mb-6"
        >
          <GlitchText text="Get in" className="text-[#1B2A4A]" />{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B2A4A] via-[#9ECCFA] to-[#1B2A4A] bg-[length:200%] animate-pulse">
            Touch
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#888888] text-lg max-w-xl mx-auto leading-relaxed"
        >
          Interested in partnering or bringing our AI placement platform to your university?{' '}
          <span className="text-[#888888555]">Reach out — we'd love to hear from you.</span>
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 mx-auto h-px w-72 bg-gradient-to-r from-transparent via-[#1B2A4A]/50 to-transparent"
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pb-28 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── LEFT: Contact info cards ── */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-start pt-2">
          {contacts.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <MagCard className="relative group bg-[#FFFFFF] border border-[#C9C2AF] rounded-[1.5rem] p-5 overflow-hidden cursor-default transition-all duration-300 hover:border-[#1B2A4A]/30">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{ background: `${c.accent}12`, border: `1px solid ${c.accent}30`, color: c.accent }}
                >
                  {c.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#888888] uppercase tracking-[0.25em]">{c.label}</p>
                  <p className="text-sm font-semibold text-[#1B2A4A] mt-0.5">{c.value}</p>
                </div>
              </MagCard>
            </motion.div>
          ))}

          {/* University promo card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[1.5rem] p-6 cursor-default"
            style={{ background: 'linear-gradient(135deg, #1B2A4A, #9ECCFA, #1B2A4A)', backgroundSize: '200%' }}
            whileHover={{ backgroundPosition: '100% 0' }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 -translate-x-full"
              animate={{ translateX: ['−100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear', repeatDelay: 1 }}
            />
            <h3 className="font-black text-[#1B2A4A] text-base mb-1">For Universities</h3>
            <p className="text-sm text-[#1B2A4A]/80 leading-relaxed">Institutional licensing and batch onboarding for placement cells. Get in touch for a custom demo.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[#1B2A4A] text-xs font-bold">
              Learn more <ArrowRight size={14} />
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Form ── */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: 8 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-3"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="relative bg-[#FFFFFF] border border-[#C9C2AF] rounded-[2rem] p-8 sm:p-10 overflow-hidden shadow-[0_20px_50px_-15px_rgba(27,42,74,0.15)]">

            {/* Top neon accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1B2A4A] to-transparent" />

            {/* Corner accent dots */}
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#1B2A4A]/40" />
            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-[#1B2A4A]/20" />

            {/* Scanline effect */}
            <motion.div
              className="absolute left-0 right-0 h-24 pointer-events-none z-0"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(27,42,74,0.02), transparent)' }}
              animate={{ top: ['-20%', '120%'] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear', repeatDelay: 2 }}
            />

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative z-10 flex flex-col items-center justify-center text-center py-16 min-h-[400px]"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center text-green-400 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                  >
                    <CheckCircle size={38} />
                  </motion.div>
                  <h3 className="text-2xl font-black text-[#1B2A4A] mb-2">Message Sent!</h3>
                  <p className="text-[#666] text-sm">We'll get back to you within 1–2 business days.</p>

                  {/* Particles burst */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-[#1B2A4A]"
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{ x: Math.cos(i * 45 * Math.PI/180) * 100, y: Math.sin(i * 45 * Math.PI/180) * 100, opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div key="form" className="relative z-10">
                  {/* Form header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/60" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                      <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[#888888] font-mono text-xs">contact.init( )</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <AnimInput label="Your Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Priya Sharma" />
                    <AnimInput label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@university.edu" />
                    <AnimInput label="Message" name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your institution or what you're looking for..." multiline />

                    {/* Submit button */}
                    <motion.button
                      type="submit"
                      disabled={sending}
                      whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(27,42,74,0.45)' }}
                      whileTap={{ scale: 0.97 }}
                      className="relative w-full overflow-hidden flex justify-center items-center gap-3 bg-[#1B2A4A] text-white font-black py-4 rounded-2xl transition-colors duration-200 text-sm disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(27,42,74,0.2)]"
                    >
                      {/* Button shimmer sweep */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        animate={{ left: ['-100%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatDelay: 1.5 }}
                      />
                      {sending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-[#1B2A4A]/30 border-t-white rounded-full"
                        />
                      ) : <Send size={16} />}
                      <span>{sending ? 'Sending...' : 'Send Message'}</span>
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
