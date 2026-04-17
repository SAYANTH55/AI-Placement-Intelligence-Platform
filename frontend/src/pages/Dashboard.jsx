import { useState, useRef } from 'react';
import { Routes, Route, useNavigate, NavLink, Navigate } from 'react-router-dom';
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
function SkillsPage({ data, selectedRoleIndex, setSelectedRoleIndex }) {
  if (!data) return (
    <div>
      <PageHeader title="Skill Gap Analysis" subtitle="Upload your resume on Overview to unlock skill gap details." />
      <EmptyState icon={Target} title="No Analysis Yet" message="Go to Overview and upload your resume first." />
    </div>
  );

  const roles = data.jobRoles || [];
  const currentRole = roles[selectedRoleIndex] || roles[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" subtitle="Deep dive into specific role requirements and gaps." />
      
      {/* Role Selector with Visual Tiers */}
      <div className="space-y-3">
        <p className="text-xs text-[#666] font-semibold uppercase tracking-wider">Select a role to see skill gaps:</p>
        <div className="flex flex-wrap gap-2 pb-2">
          {roles.map((role, idx) => {
            // Visual tier based on match percentage
            let tierColor, bgOpacity, borderOpacity, textColor, glow;
            if (selectedRoleIndex === idx) {
              // Selected: orange highlight
              tierColor = '#F97316';
              bgOpacity = 'bg-[#F97316]/20';
              borderOpacity = 'border-[#F97316]/60';
              textColor = 'text-[#F97316]';
              glow = 'shadow-[0_0_20px_rgba(249,115,22,0.3)]';
            } else if (role.match >= 70) {
              // High match: medium contrast (green)
              tierColor = '#34D399';
              bgOpacity = 'bg-[#34D399]/10';
              borderOpacity = 'border-[#34D399]/30';
              textColor = 'text-[#34D399]';
              glow = '';
            } else if (role.match >= 40) {
              // Medium match: subtle contrast (blue)
              tierColor = '#818CF8';
              bgOpacity = 'bg-[#818CF8]/8';
              borderOpacity = 'border-[#818CF8]/20';
              textColor = 'text-[#818CF8]';
              glow = '';
            } else {
              // Low/no match: faded (gray)
              tierColor = '#555';
              bgOpacity = 'bg-[#333]/30';
              borderOpacity = 'border-[#333]/30';
              textColor = 'text-[#555]';
              glow = '';
            }

            return (
              <motion.button
                key={idx}
                onClick={() => setSelectedRoleIndex(idx)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 border ${bgOpacity} ${borderOpacity} ${textColor} ${glow} cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <span>{role.title}</span>
                  <span className="opacity-70">({role.match}%)</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DarkCard delay={0}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
            <h5 className="font-black text-sm text-white">Skills You Have</h5>
            <span className="ml-auto text-xs font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              {currentRole?.present?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {currentRole?.present && currentRole.present.length > 0 ? (
              currentRole.present.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-green-500/5 border border-green-500/15 px-4 py-3 rounded-xl hover:border-green-500/25 transition-colors"
                >
                  <span className="text-sm font-semibold text-green-300">{s}</span>
                  <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Match</span>
                </motion.div>
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-[#555]">No matching skills found for this role yet.</p>
                <p className="text-[10px] text-[#444] mt-1">Try selecting a different role or add more skills to your resume.</p>
              </div>
            )}
          </div>
        </DarkCard>

        <DarkCard delay={0.1}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
            <h5 className="font-black text-sm text-white">Skills to Learn</h5>
            <span className="ml-auto text-xs font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
              {currentRole?.missing?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {currentRole?.missing && currentRole.missing.length > 0 ? (
              currentRole.missing.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-orange-500/5 border border-orange-500/15 px-4 py-3 rounded-xl hover:border-orange-500/25 transition-colors"
                >
                  <span className="text-sm font-semibold text-orange-300">{s}</span>
                  <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">📚 Learn</span>
                </motion.div>
              ))
            ) : (
              <div className="py-6 text-center bg-green-500/5 border border-green-500/15 rounded-lg">
                <p className="text-sm font-bold text-green-400">✨ Perfect Match!</p>
                <p className="text-xs text-green-300/60 mt-1">You have all the core skills for this role.</p>
              </div>
            )}
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

      {/* Dimension Breakdown Section */}
      <DarkCard delay={0.2} glow>
        <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-6">Dimension Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Skills Breadth', value: Math.min(100, Math.max(0, Math.round((data.allDetected?.length || 0) / 15 * 100))), color: '#F97316', desc: 'Variety of technical skills' },
            { label: 'Work Experience', value: Math.min(100, 75), color: '#34D399', desc: 'Years & depth of experience' },
            { label: 'Project Portfolio', value: Math.min(100, Math.round((data.jobRoles?.length || 0) * 15)), color: '#818CF8', desc: 'Project complexity & scope' },
            { label: 'Certifications', value: 60, color: '#F59E0B', desc: 'Professional credentials' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white">{item.label}</label>
                <span className="text-xs font-black text-[#888]" style={{ color: item.color }}>{item.value}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#0A0A0A] border border-[#181818] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 + i * 0.08 }}
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 12px ${item.color}60`,
                  }}
                />
              </div>
              <p className="text-xs text-[#555] text-right">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </DarkCard>

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
function RecommendationsView({ data }) {
  const [recTab, setRecTab] = useState('resume');
  
  // Hardcoded fallback if LLM is down
  const fallbackEnhancements = [
    { txt: "Communication", type: "strength" }, 
    { txt: "Leadership & Coordination", type: "strength" }, 
    { txt: "Problem solving & Critical Thinking", type: "strength" },
    { txt: "Time Management", type: "strength" }, 
    { txt: "Attention to Detail", type: "strength" }, 
    { txt: "Teamwork & Adaptability", type: "strength" },
    { txt: "Agile/Scrum Methodologies", type: "inferred" }, 
    { txt: "Include Quantifiable Metrics (e.g. 'Increased sales by 20%')", type: "inferred" },
    { txt: "Tailor Resume keywords to ATS", type: "inferred" }, 
    { txt: "Use Strong Action Verbs", type: "inferred" },
    { txt: "Clean, Professional Formatting", type: "inferred" }
  ];

  // Dynamically map from LLM generated outputs
  let finalEnhancements = fallbackEnhancements;
  if (data?.llm_enhancement) {
    const ai = data.llm_enhancement;
    finalEnhancements = [
      ...(ai.inferred_skills || []).map(s => ({ txt: s, type: 'inferred' })),
      ...(ai.strengths || []).map(s => ({ txt: s, type: 'strength' })),
      ...(ai.weaknesses || []).map(s => ({ txt: s, type: 'weakness' }))
    ];
  }

  // Use Dynamic LLM Learning Path if available
  const learningPath = (data?.llm_insights?.learning_path?.length > 0)
    ? data.llm_insights.learning_path
    : data?.recommendations;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setRecTab('resume')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
            recTab === 'resume'
              ? 'bg-[#34D399] border-[#34D399] text-[#050505] shadow-[0_0_15px_rgba(52,211,153,0.4)]'
              : 'bg-black border-[#1A1A1A] text-[#444] hover:text-[#888]'
          }`}
        >
          Resume Enhancements
        </button>
        <button
          onClick={() => setRecTab('career')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
            recTab === 'career'
              ? 'bg-[#F97316] border-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'bg-black border-[#1A1A1A] text-[#444] hover:text-[#888]'
          }`}
        >
          Career Recommendations
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={recTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {recTab === 'resume' ? (
            <DarkCard glow>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                   <div>
                     <h4 className="font-black text-sm text-white uppercase tracking-widest">AI Inferred Profile Insights</h4>
                     <p className="text-xs text-[#888] mt-1">Our AI has mapped hidden context behind your bullet points to infer additional traits and critical weaknesses.</p>
                   </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {finalEnhancements.map((item, idx) => {
                  let badgeColors = "bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399] hover:bg-[#34D399]/20";
                  if (item.type === 'weakness') {
                    badgeColors = "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20";
                  } else if (item.type === 'inferred') {
                    badgeColors = "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20";
                  }
                  
                  return (
                    <span key={idx} className={`border text-xs font-bold px-4 py-2 rounded-full cursor-default transition-colors ${badgeColors}`}>
                      {item.type === 'weakness' && <span className="mr-1">⚠️</span>}
                      {item.type === 'inferred' && <span className="mr-1">🔗</span>}
                      {item.txt}
                    </span>
                  );
                })}
              </div>
            </DarkCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DarkCard delay={0}>
                <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-5">Target Roles</h4>
                <div className="space-y-3">
                  {data?.jobRoles?.map((role, i) => (
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
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className="text-[10px] font-black text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/20 px-2.5 py-1 rounded-full">
                          {typeof role === 'object' ? `${role.match}% match` : 'High Match'}
                        </span>
                        {data?.experience_advantage_roles?.includes(typeof role === 'string' ? role : role.title) && (
                          <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                            ✨ AI Enhanced Fit
                          </span>
                        )}
                      </div>
                      </div>
                      {typeof role === 'object' && role.salary && (
                        <p className="text-xs text-[#555] mt-1">{role.salary}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </DarkCard>

              <DarkCard delay={0.1} glow>
                <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-5">Learning Path</h4>
                <div className="space-y-3 relative">
                  <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gradient-to-b from-[#F97316]/40 to-transparent" />
                  {learningPath?.map((rec, i) => (
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
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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
      <RecommendationsView data={data} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Modules Hub: The Entry View
   ══════════════════════════════════════════════════════════════════ */
function ModulesHub() {
  const navigate = useNavigate();
  const engines = [
    {
      id: 'profile',
      title: 'Profile Intelligence',
      desc: 'Understand your market fit. Resume parsing, skill extraction, and placement probability.',
      icon: <Target className="w-8 h-8" />,
      color: '#F97316',
      path: '/dashboard/profile',
      status: 'Ready'
    },
    {
      id: 'prep',
      title: 'Preparation Engine',
      desc: 'Master the core. OOP, DSA, and CS fundamentals tailored to your skill gaps.',
      icon: <Briefcase className="w-8 h-8" />,
      color: '#34D399',
      path: '/dashboard/preparation',
      status: 'Early Access'
    },
    {
      id: 'practice',
      title: 'Practice Engine',
      desc: 'Get job-ready. Aptitude, coding practice, and simulated interview prep.',
      icon: <Sparkles className="w-8 h-8" />,
      color: '#818CF8',
      path: '/dashboard/practice',
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Intelligence Modules" subtitle="Choose an engine to accelerate your placement journey." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {engines.map((engine, i) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(engine.path)}
            className="group cursor-pointer"
          >
            <DarkCard 
              className={`h-full border-t-2 overflow-visible`} 
              style={{ borderTopColor: engine.color }}
              glow
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="p-3 rounded-2xl bg-black border border-[#1A1A1A] transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    style={{ color: engine.color }}
                  >
                    {engine.icon}
                  </div>
                  <span 
                    className="text-[10px] font-black px-2 py-1 rounded-full border"
                    style={{ color: engine.color, borderColor: `${engine.color}40`, backgroundColor: `${engine.color}10` }}
                  >
                    {engine.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-[#F97316] transition-colors">
                  {engine.title}
                </h3>
                <p className="text-[#555] text-xs leading-relaxed flex-1">
                  {engine.desc}
                </p>
                
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-[#F97316] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter Engine <ArrowRight size={12} />
                </div>
              </div>
            </DarkCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Preparation Engine (WIP)
   ══════════════════════════════════════════════════════════════════ */
function PreparationModule() {
  const sections = [
    {
      title: 'Programming Fundamentals',
      items: ['OOP (Inheritance, Polymorphism)', 'Data Types', 'Memory Basics']
    },
    {
      title: 'DSA Mastery',
      items: ['Arrays & Linked Lists', 'Trees & Graphs', 'Sorting & Searching']
    },
    {
      title: 'Core CS Concepts',
      items: ['DBMS', 'Operating Systems', 'Networking']
    },
    {
      title: 'Domain Specific',
      items: ['AI: ML & Deep Learning', 'Web: React & APIs']
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Preparation Engine" subtitle="Convert skill gaps into mastery through structured learning modules." />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {sections.map((s, idx) => (
          <DarkCard key={idx} delay={idx * 0.1}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-[#34D399] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <h4 className="font-black text-sm text-white tracking-widest uppercase">{s.title}</h4>
            </div>
            <div className="space-y-2">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-black/40 border border-[#1A1A1A] px-4 py-3 rounded-xl group hover:border-[#34D399]/30 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]/40" />
                  <span className="text-xs text-[#888] font-medium group-hover:text-[#34D399] transition-colors">{item}</span>
                  <span className="ml-auto text-[10px] font-bold text-[#333] italic">WIP</span>
                </div>
              ))}
            </div>
          </DarkCard>
        ))}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Practice Engine (WIP)
   ══════════════════════════════════════════════════════════════════ */
function PracticeModule() {
  const practiceAreas = [
    { title: 'Aptitude Section', icon: <Target size={18} />, sub: ['Quantitative', 'Logical Reasoning', 'Verbal'] },
    { title: 'Coding Practice', icon: <RefreshCw size={18} />, sub: ['Easy', 'Medium', 'Hard (DSA Heavy)'] },
    { title: 'Interview Prep', icon: <Sparkles size={18} />, sub: ['Technical (REST, Patterns)', 'HR (Behavioral)'] }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Practice Engine" subtitle="Sharpen your sword. Rigorous practice modules for the final mile." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {practiceAreas.map((area, i) => (
          <DarkCard key={i} delay={i * 0.1} glow>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#818CF8]/10 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8] mb-4">
                {area.icon}
              </div>
              <h4 className="font-black text-white text-base mb-4">{area.title}</h4>
              <div className="w-full space-y-2">
                {area.sub.map((s, idx) => (
                  <div key={idx} className="bg-[#050505] border border-[#1A1A1A] py-2 px-3 rounded-lg text-[10px] font-bold text-[#555] uppercase tracking-tighter">
                    {s}
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full py-2 rounded-xl bg-[#818CF8]/5 border border-[#818CF8]/20 text-[10px] font-black text-[#818CF8] uppercase tracking-widest opacity-50 cursor-not-allowed">
                Initializing Arena...
              </button>
            </div>
          </DarkCard>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Dashboard Component
   ══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAppContext();
  const [analyzedData, setAnalyzedData] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const handleAnalyzeComplete = (data) => {
    setAnalyzedData(data);
    setSelectedRoleIndex(0);
  };
  const handleReset = () => { setAnalyzedData(null); setActiveTab('overview'); setSelectedRoleIndex(0); };

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
        <h4 className="text-sm font-black text-[#F97316] uppercase tracking-widest mb-4">Detected Skills</h4>
        <div className="flex flex-wrap gap-2">
          {analyzedData?.allDetected?.map((skill, i) => (
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
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {analyzedData?.jobRoles?.map((role, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedRoleIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                selectedRoleIndex === idx 
                  ? 'bg-[#F97316] border-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                  : 'bg-black border-[#1A1A1A] text-[#444] hover:text-[#888]'
              }`}
            >
              {role.title}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DarkCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              <h5 className="font-black text-sm text-white">Strong Match</h5>
            </div>
            <div className="space-y-2">
              {analyzedData?.jobRoles?.[selectedRoleIndex]?.present?.map((s, i) => (
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
              {analyzedData?.jobRoles?.[selectedRoleIndex]?.missing?.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 px-4 py-2.5 rounded-xl">
                  <span className="text-sm font-semibold text-red-300">{s}</span>
                  <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">Missing</span>
                </div>
              ))}
            </div>
          </DarkCard>
        </div>
      </div>
    ),
    recommendations: <RecommendationsView data={analyzedData} />
  };

  const OverviewPage = () => (
    <div className="space-y-8">
      {!analyzedData ? (
        <div className="w-full space-y-6">
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
          
          {/* AI Insights Card */}
          {analyzedData?.llm_enhancement && analyzedData.llm_enhancement.summary && (
            <DarkCard delay={0.2} glow>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-purple-400">✨</span>
                <h4 className="font-black text-sm text-white uppercase tracking-widest">AI Intelligence Summary</h4>
              </div>
              <p className="text-[#888] text-sm leading-relaxed mb-4">{analyzedData.llm_enhancement.summary}</p>
              {analyzedData.llm_insights?.career_advice && (
                 <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
                   <h5 className="text-xs font-bold text-white mb-2">Career Advisory Pipeline</h5>
                   <p className="text-[#666] text-xs leading-relaxed">{analyzedData.llm_insights.career_advice}</p>
                 </div>
              )}
            </DarkCard>
          )}

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

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full overflow-y-auto relative">
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

        {/* Routes - Modular Hub Entry */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<ModulesHub />} />
            
            {/* Module 1: Profile Intelligence */}
            <Route path="/profile" element={<OverviewPage />} />
            <Route path="/analysis" element={<AnalysisPage data={analyzedData} onAnalyzeComplete={handleAnalyzeComplete} />} />
            <Route path="/skills" element={<SkillsPage data={analyzedData} selectedRoleIndex={selectedRoleIndex} setSelectedRoleIndex={setSelectedRoleIndex} />} />
            <Route path="/score" element={<ScorePage data={analyzedData} />} />
            <Route path="/recommendations" element={<RecommendationsPage data={analyzedData} />} />
            
            {/* Module 2: Preparation Engine */}
            <Route path="/preparation" element={<PreparationModule />} />
            
            {/* Module 3: Practice Engine */}
            <Route path="/practice" element={<PracticeModule />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
