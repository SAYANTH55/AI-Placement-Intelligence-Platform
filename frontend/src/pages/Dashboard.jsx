import { useState, useRef } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { aiResult } from '../utils/mockData';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/dashboard/MobileNav';
import UploadBox from '../components/dashboard/UploadBox';
import InsightCards from '../components/dashboard/InsightCards';
import SkillBadge from '../components/dashboard/SkillBadge';
import ScoreRing from '../components/dashboard/ScoreRing';
import { RefreshCw, Menu, TrendingUp, Target, Briefcase, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

/* ── Shared dark card ── */
function DarkCard({ children, className = '', delay = 0, glow = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 overflow-hidden ${glow ? 'shadow-[0_0_40px_rgba(249,115,22,0.07)]' : ''} ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/30 to-transparent" />
      {children}
    </motion.div>
  );
}

/* ── Empty state ── */
function EmptyState({ icon: Icon, title, message }) {
  return (
    <DarkCard className="p-16 text-center" glow>
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] mb-6 mx-auto shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      >
        <Icon size={28} />
      </motion.div>
      <h3 className="text-white font-black text-lg mb-2">{title}</h3>
      <p className="text-[#555] text-sm">{message}</p>
    </DarkCard>
  );
}

/* ── Page header ── */
function PageHeader({ title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-6 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
        <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
      </div>
      <p className="text-[#555] text-sm ml-3">{subtitle}</p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Sub-page: Analysis
══════════════════════════════════════════════════════════════════ */
function AnalysisPage({ data, onAnalyzeComplete }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Resume Analysis" subtitle="Deep extraction of your skills and career signals." />
      {!data ? (
        <UploadBox onAnalyzeComplete={onAnalyzeComplete} />
      ) : (
        <div className="space-y-6">
          <DarkCard delay={0}>
            <h4 className="text-sm font-black text-[#F97316] uppercase tracking-widest mb-4">Parsed Resume Text</h4>
            <div className="text-[#888] text-sm leading-relaxed bg-[#050505] border border-[#1A1A1A] p-4 rounded-xl font-mono">
              {data.extractedText}
            </div>
          </DarkCard>
          <DarkCard delay={0.1}>
            <h4 className="text-sm font-black text-[#F97316] uppercase tracking-widest mb-4">Detected Skills</h4>
            <div className="flex flex-wrap gap-2">
              {data.allDetected.map((skill, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[#F97316]/10 border border-[#F97316]/25 text-[#F97316] text-xs font-bold px-3 py-1.5 rounded-full"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </DarkCard>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Sub-page: Skill Gap
══════════════════════════════════════════════════════════════════ */
function SkillsPage({ data }) {
  if (!data) return (
    <div>
      <PageHeader title="Skill Gap Analysis" subtitle="Upload your resume on Overview to unlock skill gap details." />
      <EmptyState icon={Target} title="No Analysis Yet" message="Go to Overview and upload your resume first." />
    </div>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" subtitle="AI mapped your resume against industry requirements." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DarkCard delay={0}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <h5 className="font-black text-sm text-white">Strong Match ({data.skills.length})</h5>
          </div>
          <div className="space-y-2">
            {data.skills.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between bg-green-500/5 border border-green-500/15 px-4 py-2.5 rounded-xl"
              >
                <span className="text-sm font-semibold text-green-300">{s}</span>
                <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">✓ Present</span>
              </motion.div>
            ))}
          </div>
        </DarkCard>
        <DarkCard delay={0.1}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
            <h5 className="font-black text-sm text-white">Critical Gaps ({data.missing.length})</h5>
          </div>
          <div className="space-y-2">
            {data.missing.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between bg-red-500/5 border border-red-500/15 px-4 py-2.5 rounded-xl"
              >
                <span className="text-sm font-semibold text-red-300">{s}</span>
                <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">Missing</span>
              </motion.div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Sub-page: Score
══════════════════════════════════════════════════════════════════ */
function ScorePage({ data }) {
  if (!data) return (
    <div>
      <PageHeader title="Placement Score" subtitle="Upload your resume to get your personalized readiness score." />
      <EmptyState icon={TrendingUp} title="No Score Yet" message="Upload your resume on Overview first." />
    </div>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Placement Score" subtitle="Your career readiness metrics across multiple dimensions." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Overall Readiness', value: data.score, desc: 'Composite score across all dimensions', color: '#F97316' },
          { label: 'Interview Confidence', value: data.interview_confidence, desc: 'Communication & tech depth', color: '#818CF8' },
          { label: 'Technical Depth', value: data.technical_depth, desc: 'Core engineering & algorithm strength', color: '#34D399' },
        ].map((item, i) => (
          <DarkCard key={i} delay={i * 0.1} glow className="flex flex-col items-center gap-4">
            <div className="relative">
              <ScoreRing score={item.value} size={110} strokeWidth={10} />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ boxShadow: [`0 0 0px ${item.color}40`, `0 0 20px ${item.color}40`, `0 0 0px ${item.color}40`] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-full"
                />
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-black text-sm text-white">{item.label}</h4>
              <p className="text-xs text-[#555] mt-0.5">{item.desc}</p>
            </div>
          </DarkCard>
        ))}
      </div>
      <DarkCard delay={0.3}>
        <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-4">Target Companies</h4>
        <div className="flex flex-wrap gap-2">
          {data.companies.map((c, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.04 }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(249,115,22,0.5)' }}
              className="bg-[#F97316]/5 border border-[#F97316]/20 text-[#F97316] text-xs font-black px-4 py-2 rounded-full cursor-default"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </DarkCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Sub-page: Recommendations
══════════════════════════════════════════════════════════════════ */
function RecommendationsPage({ data }) {
  if (!data) return (
    <div>
      <PageHeader title="Career Recommendations" subtitle="Upload your resume to unlock your personalized learning path." />
      <EmptyState icon={Briefcase} title="No Recommendations Yet" message="Upload your resume on Overview first." />
    </div>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Career Recommendations" subtitle="AI-powered learning path and role matching." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Roles */}
        <DarkCard delay={0}>
          <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-5">Target Roles</h4>
          <div className="space-y-3">
            {data.jobRoles.map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ borderColor: 'rgba(249,115,22,0.3)', backgroundColor: 'rgba(249,115,22,0.03)' }}
                className="p-4 border border-[#1A1A1A] rounded-xl cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-white group-hover:text-[#F97316] transition-colors">
                    {typeof role === 'string' ? role : role.title}
                  </h5>
                  <span className="text-[10px] font-black text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/20 px-2.5 py-1 rounded-full">
                    {typeof role === 'object' ? `${role.match}% match` : 'High Match'}
                  </span>
                </div>
                {typeof role === 'object' && role.salary && (
                  <p className="text-xs text-[#555] mt-1">{role.salary}</p>
                )}
              </motion.div>
            ))}
          </div>
        </DarkCard>

        {/* Learning Path */}
        <DarkCard delay={0.1} glow>
          <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-5">Learning Path</h4>
          <div className="space-y-3 relative">
            {/* connector line */}
            <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gradient-to-b from-[#F97316]/40 to-transparent" />
            {data.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative flex items-start gap-4 pl-1"
              >
                <div className="w-7 h-7 rounded-full bg-[#F97316] text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)] z-10 relative">
                  {i + 1}
                </div>
                <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl p-3 text-xs text-[#888] leading-relaxed flex-1">
                  {rec}
                </div>
              </motion.div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAppContext();
  const [analyzedData, setAnalyzedData] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyzeComplete = () => setAnalyzedData(aiResult);
  const handleReset = () => { setAnalyzedData(null); setActiveTab('overview'); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const tabs = [
    { id: 'overview', label: 'Analysis Overview' },
    { id: 'analysis', label: 'Skill Gap Breakdown' },
    { id: 'recommendations', label: 'Career Recommendations' }
  ];

  const overviewTabContent = {
    overview: (
      <DarkCard>
        <h4 className="text-sm font-black text-[#F97316] uppercase tracking-widest mb-4">Resume Parsing Output</h4>
        <div className="text-[#888] text-sm leading-relaxed mb-6 bg-[#050505] border border-[#1A1A1A] p-4 rounded-xl font-mono">
          {analyzedData?.extractedText}
        </div>
        <h4 className="text-sm font-black text-[#F97316] uppercase tracking-widest mb-4">Detected Skills</h4>
        <div className="flex flex-wrap gap-2">
          {analyzedData?.allDetected.map((skill, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#F97316]/10 border border-[#F97316]/25 text-[#F97316] text-xs font-bold px-3 py-1.5 rounded-full"
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </DarkCard>
    ),
    analysis: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DarkCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <h5 className="font-black text-sm text-white">Strong Match</h5>
          </div>
          <div className="space-y-2">
            {analyzedData?.skills.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-green-500/5 border border-green-500/15 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-green-300">{s}</span>
                <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">✓ Present</span>
              </div>
            ))}
          </div>
        </DarkCard>
        <DarkCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
            <h5 className="font-black text-sm text-white">Critical Gaps</h5>
          </div>
          <div className="space-y-2">
            {analyzedData?.missing.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-red-300">{s}</span>
                <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">Missing</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    ),
    recommendations: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DarkCard>
          <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-4">Target Roles</h4>
          <div className="space-y-3">
            {analyzedData?.jobRoles.map((role, i) => (
              <motion.div key={i} whileHover={{ borderColor: 'rgba(249,115,22,0.3)' }} className="p-4 border border-[#1A1A1A] rounded-xl group cursor-pointer transition-all">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-white group-hover:text-[#F97316] transition-colors">
                    {typeof role === 'string' ? role : role.title}
                  </h5>
                  <span className="text-[10px] font-black text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/20 px-2.5 py-1 rounded-full">
                    {typeof role === 'object' ? `${role.match}% match` : 'High Match'}
                  </span>
                </div>
                {typeof role === 'object' && role.salary && <p className="text-xs text-[#555] mt-1">{role.salary}</p>}
              </motion.div>
            ))}
          </div>
        </DarkCard>
        <DarkCard glow>
          <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-4">Learning Path</h4>
          <div className="space-y-3 relative">
            <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gradient-to-b from-[#F97316]/40 to-transparent" />
            {analyzedData?.recommendations.map((rec, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-1">
                <div className="w-7 h-7 rounded-full bg-[#F97316] text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)] z-10">
                  {i + 1}
                </div>
                <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl p-3 text-xs text-[#888] leading-relaxed flex-1">{rec}</div>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    )
  };

  const OverviewPage = () => (
    <div className="space-y-8">
      {!analyzedData ? (
        <div className="max-w-2xl space-y-6">
          <UploadBox onAnalyzeComplete={handleAnalyzeComplete} />

          {/* Info banner */}
          <DarkCard delay={0.15} glow>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Zap size={18} />
              </div>
              <p className="text-sm text-[#888] leading-relaxed">
                Our intelligence layer cross-references your resume against{' '}
                <span className="text-[#F97316] font-bold">50,000+ placement records</span> to generate accurate career trajectories and skill gap analysis.
              </p>
            </div>
          </DarkCard>

          {/* Feature preview chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Target size={20} />, title: 'Skill Gap Analysis', desc: 'Instantly identify missing skills', color: '#F97316' },
              { icon: <TrendingUp size={20} />, title: 'Placement Score', desc: 'Know your readiness percentile', color: '#818CF8' },
              { icon: <Sparkles size={20} />, title: 'Career Roadmap', desc: 'Get a personalized learning path', color: '#34D399' },
            ].map((tip, i) => (
              <DarkCard key={i} delay={0.2 + i * 0.08}>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="flex flex-col items-center text-center cursor-default gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${tip.color}15`, border: `1px solid ${tip.color}25`, color: tip.color }}>
                    {tip.icon}
                  </div>
                  <h4 className="text-xs font-black text-white">{tip.title}</h4>
                  <p className="text-[11px] text-[#555]">{tip.desc}</p>
                </motion.div>
              </DarkCard>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <InsightCards data={analyzedData} />
          {/* Dark tab bar */}
          <div>
            <div className="flex gap-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-1 mb-6 w-fit">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    activeTab === tab.id ? 'text-white' : 'text-[#444] hover:text-[#888]'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-[#F97316] rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {overviewTabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex bg-[#060606] min-h-screen">
      <Sidebar />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full overflow-y-auto relative">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        {/* Mobile menu button */}
        <div className="flex items-center justify-between mb-6 md:hidden relative z-10">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1A1A1A] px-3 py-2 rounded-xl text-[#888] hover:text-white transition-colors"
          >
            <Menu size={18} />
            <span className="text-sm font-semibold">Menu</span>
          </button>
          <div className="text-sm font-black text-[#888]">
            {greeting}, <span className="text-[#F97316]">{user?.name || 'User'}</span>
          </div>
        </div>

        {/* Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10"
        >
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FF8C3A]">
                {user?.name || 'User'}
              </span>{' '}
              <span className="text-2xl">👋</span>
            </h1>
            <p className="mt-1 text-sm text-[#555]">Career Intelligence Dashboard — AI-powered insights at a glance.</p>
          </div>

          <div className="flex items-center gap-3">
            {analyzedData && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-[#0A0A0A] px-4 py-2 rounded-full border border-[#F97316]/30 text-sm font-black flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-green-400 inline-block"
                    />
                    <span className="text-[#888]">Score:</span>
                    <span className="text-[#F97316]">{analyzedData.score}%</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReset}
                    className="flex items-center gap-2 text-sm text-[#555] hover:text-white bg-[#0A0A0A] border border-[#1A1A1A] px-4 py-2 rounded-full transition-all hover:border-[#333]"
                  >
                    <RefreshCw size={14} />
                    New Analysis
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Mobile: score banner */}
        {analyzedData && (
          <div className="md:hidden flex items-center justify-between mb-4 bg-[#0A0A0A] px-4 py-2.5 rounded-2xl border border-[#F97316]/20">
            <div className="text-sm font-black flex items-center gap-2 text-[#888]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              Score: <span className="text-[#F97316]">{analyzedData.score}%</span>
            </div>
            <button onClick={handleReset} className="text-xs text-[#555] hover:text-red-400 flex items-center gap-1">
              <RefreshCw size={12} /> Reset
            </button>
          </div>
        )}

        {/* Routes */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/analysis" element={<AnalysisPage data={analyzedData} onAnalyzeComplete={handleAnalyzeComplete} />} />
            <Route path="/skills" element={<SkillsPage data={analyzedData} />} />
            <Route path="/score" element={<ScorePage data={analyzedData} />} />
            <Route path="/recommendations" element={<RecommendationsPage data={analyzedData} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
