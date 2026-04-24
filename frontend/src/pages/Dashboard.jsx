import { useState, useRef, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, NavLink, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { aiResult } from '../utils/mockData';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/dashboard/MobileNav';
import UploadBox from '../components/dashboard/UploadBox';
import InsightCards from '../components/dashboard/InsightCards';
import SkillBadge from '../components/dashboard/SkillBadge';
import ScoreRing from '../components/dashboard/ScoreRing';
import { RefreshCw, Menu, TrendingUp, Target, Briefcase, Sparkles, ArrowRight, Zap, BookOpen, Code, MessageSquare, CheckCircle, Circle, BarChart2, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { fetchPreparationPlan, fetchPracticeSet, fetchProgress } from '../services/engineApi';
import OutcomeTracker from '../components/dashboard/OutcomeTracker';

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
  const { preparationData, practiceData } = useAppContext();

  const engines = [
    {
      id: 'profile',
      title: 'Profile Intelligence',
      desc: 'Understand your market fit. Resume parsing, skill extraction, and placement probability.',
      icon: <Target className="w-8 h-8" />,
      color: '#F97316',
      path: '/dashboard/profile',
      status: 'Live'
    },
    {
      id: 'prep',
      title: 'Preparation Engine',
      desc: 'Dynamic learning roadmap. Skill gaps converted to prioritized, topic-level action plans.',
      icon: <BookOpen className="w-8 h-8" />,
      color: '#34D399',
      path: '/dashboard/preparation',
      status: preparationData ? 'Loaded' : 'Ready'
    },
    {
      id: 'practice',
      title: 'Practice Engine',
      desc: 'Role-specific aptitude, DSA coding problems, and technical + HR interview questions.',
      icon: <Sparkles className="w-8 h-8" />,
      color: '#818CF8',
      path: '/dashboard/practice',
      status: practiceData ? 'Loaded' : 'Live'
    },
    {
      id: 'tracking',
      title: 'Tracking Engine',
      desc: 'Score evolution charts, session history, and a feedback loop that improves your prediction.',
      icon: <BarChart2 className="w-8 h-8" />,
      color: '#F59E0B',
      path: '/dashboard/tracking',
      status: 'Live'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Intelligence Modules" subtitle="Choose an engine to accelerate your placement journey." />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {engines.map((engine, i) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(engine.path)}
            className="group cursor-pointer"
          >
            <DarkCard className="h-full" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-black border border-[#1A1A1A] transition-all group-hover:scale-110" style={{ color: engine.color }}>
                    {engine.icon}
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full border" style={{ color: engine.color, borderColor: `${engine.color}40`, backgroundColor: `${engine.color}10` }}>
                    {engine.status}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mb-2 group-hover:text-[#F97316] transition-colors">{engine.title}</h3>
                <p className="text-[#555] text-xs leading-relaxed flex-1">{engine.desc}</p>
                <div className="mt-5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: engine.color }}>
                  Enter Engine <ArrowRight size={11} />
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
   Preparation Engine — Live Learning Roadmap
   ══════════════════════════════════════════════════════════════════ */
function PreparationModule() {
  const { preparationData, setPreparationData, analyzedData: _unused } = useAppContext();
  // We grab analyzedData from the parent scope via props threading
  return <PreparationContent />;
}

function PreparationContent({ analyzedData }) {
  const { preparationData, setPreparationData } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prep_completed') || '[]'); } catch { return []; }
  });

  const tierConfig = {
    programming: { label: 'Programming Fundamentals', color: '#F97316', glow: 'rgba(249,115,22,0.15)' },
    dsa:         { label: 'DSA & Algorithms',         color: '#818CF8', glow: 'rgba(129,140,248,0.15)' },
    core_cs:     { label: 'Core CS Concepts',          color: '#34D399', glow: 'rgba(52,211,153,0.15)' },
    domain:      { label: 'Domain Specific',           color: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
  };

  const priorityColors = { high: '#F97316', medium: '#818CF8', low: '#34D399' };
  const priorityLabels = { high: 'Critical', medium: 'Recommended', low: 'Bonus' };

  const toggleTopic = useCallback((topic) => {
    setCompletedTopics(prev => {
      const updated = prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic];
      localStorage.setItem('prep_completed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const plan = preparationData;

  if (!plan) {
    return (
      <div className="space-y-8">
        <PageHeader title="Preparation Engine" subtitle="Upload your resume to get a personalized learning roadmap." />
        <EmptyState icon={BookOpen} title="No Roadmap Yet" message="Go to Profile Intelligence, upload your resume. Your custom roadmap will appear here." />
      </div>
    );
  }

  const tiers = plan.tiers || {};
  const allTierKeys = ['programming', 'dsa', 'core_cs', 'domain'];
  const totalCompleted = completedTopics.length;
  const totalTopics = plan.learning_plan?.reduce((sum, item) => sum + (item.topics?.length || 0), 0) || 0;
  const progressPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Preparation Engine" subtitle={`Learning roadmap for ${plan.target_role || 'your target role'} — ${plan.total_gaps} skill gaps identified.`} />

      {/* Progress Overview */}
      <DarkCard glow delay={0}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest">Overall Roadmap Progress</h4>
            <p className="text-xs text-[#555] mt-1">{plan.total_gaps} skills to acquire · ~{plan.estimated_weeks} weeks estimated</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white">{progressPct}%</span>
            <p className="text-xs text-[#555]">topics mastered</p>
          </div>
        </div>
        <div className="w-full h-2 bg-[#111] border border-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.5)]"
          />
        </div>
      </DarkCard>

      {/* 4 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allTierKeys.map((tierKey, idx) => {
          const conf = tierConfig[tierKey];
          const items = tiers[tierKey] || [];
          if (items.length === 0) return null;
          return (
            <DarkCard key={tierKey} delay={idx * 0.1}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-6 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: conf.color, boxShadow: `0 0 8px ${conf.glow}` }} />
                <h4 className="font-black text-sm text-white tracking-widest uppercase">{conf.label}</h4>
                <span className="ml-auto text-[10px] font-black px-2 py-1 rounded-full border" style={{ color: conf.color, borderColor: `${conf.color}40`, backgroundColor: `${conf.color}10` }}>
                  {items.length} skills
                </span>
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="border border-[#1A1A1A] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-black/30">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors[item.priority] || '#555' }} />
                      <span className="text-sm font-bold text-white flex-1">{item.skill}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ color: priorityColors[item.priority], backgroundColor: `${priorityColors[item.priority]}15`, border: `1px solid ${priorityColors[item.priority]}30` }}>
                        {priorityLabels[item.priority]}
                      </span>
                    </div>
                    <div className="px-4 py-2 space-y-1.5 bg-black/10">
                      {item.topics?.map((topic, ti) => {
                        const done = completedTopics.includes(topic);
                        return (
                          <button
                            key={ti}
                            onClick={() => toggleTopic(topic)}
                            className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs transition-all ${
                              done ? 'text-[#34D399]' : 'text-[#555] hover:text-[#888]'
                            }`}
                          >
                            {done
                              ? <CheckCircle size={13} className="text-[#34D399] flex-shrink-0" />
                              : <Circle size={13} className="text-[#333] flex-shrink-0" />
                            }
                            <span className={done ? 'line-through opacity-60' : ''}>{topic}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </DarkCard>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Practice Engine — Live 3-Tab Arena
   ══════════════════════════════════════════════════════════════════ */
function PracticeModule() {
  return <PracticeContent />;
}

function PracticeContent() {
  const { practiceData } = useAppContext();
  const [activeTab, setActiveTab] = useState('aptitude');
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [codingFilter, setCodingFilter] = useState('all');

  const toggleAnswer = (id) => setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));

  const tabs = [
    { id: 'aptitude',  label: 'Aptitude',  icon: <Target size={14} />,        color: '#F97316' },
    { id: 'coding',    label: 'Coding',    icon: <Code size={14} />,           color: '#818CF8' },
    { id: 'interview', label: 'Interview', icon: <MessageSquare size={14} />, color: '#34D399' },
  ];

  if (!practiceData) {
    return (
      <div className="space-y-8">
        <PageHeader title="Practice Engine" subtitle="Sharpen your skills with role-specific practice problems." />
        <EmptyState icon={Sparkles} title="Arena Not Loaded" message="Upload your resume in Profile Intelligence first. Your custom practice set will appear here." />
      </div>
    );
  }

  const diffBadge = { easy: { color: '#34D399', bg: 'rgba(52,211,153,0.1)' }, medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }, hard: { color: '#F87171', bg: 'rgba(248,113,113,0.1)' } };
  const catColors = { quantitative: '#F97316', logical_reasoning: '#818CF8', verbal: '#34D399' };

  const filteredCoding = codingFilter === 'all'
    ? practiceData.coding
    : practiceData.coding?.filter(p => p.difficulty === codingFilter);

  return (
    <div className="space-y-6">
      <PageHeader title="Practice Engine" subtitle={`Role: ${practiceData.target_role} · ${practiceData.stats?.total_coding || 0} coding · ${practiceData.stats?.total_aptitude || 0} aptitude · ${practiceData.stats?.total_interview || 0} interview`} />

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aptitude',  count: practiceData.stats?.total_aptitude || 0,  color: '#F97316' },
          { label: 'Coding',    count: practiceData.stats?.total_coding || 0,    color: '#818CF8' },
          { label: 'Interview', count: practiceData.stats?.total_interview || 0, color: '#34D399' },
        ].map((s, i) => (
          <DarkCard key={i} delay={i * 0.05}>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">{s.label} Qs</div>
            </div>
          </DarkCard>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === tab.id ? 'text-white' : 'text-[#444] hover:text-[#888]'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="practice-tab-pill" className="absolute inset-0 rounded-xl" style={{ backgroundColor: tab.color, boxShadow: `0 0 15px ${tab.color}60` }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{tab.icon}{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* ─── APTITUDE TAB ─── */}
          {activeTab === 'aptitude' && (
            <div className="space-y-4">
              {practiceData.aptitude?.map((q, i) => (
                <DarkCard key={q.id} delay={i * 0.03}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ backgroundColor: `${catColors[q.category] || '#F97316'}15`, color: catColors[q.category] || '#F97316', border: `1px solid ${catColors[q.category] || '#F97316'}30` }}>{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: catColors[q.category] || '#F97316' }}>{q.category?.replace('_', ' ')}</span>
                      <p className="text-sm font-semibold text-white mt-1 leading-relaxed">{q.question}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {q.options?.map((opt, oi) => (
                      <div key={oi} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        revealedAnswers[q.id] && opt.startsWith(q.answer)
                          ? 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
                          : 'bg-[#0A0A0A] border-[#1A1A1A] text-[#666]'
                      }`}>{opt}</div>
                    ))}
                  </div>
                  <button onClick={() => toggleAnswer(q.id)} className="text-[10px] font-black uppercase tracking-widest text-[#F97316] hover:text-[#FF8C3A] transition-colors flex items-center gap-1">
                    {revealedAnswers[q.id] ? '▲ Hide' : '▼ Reveal'} Answer
                  </button>
                  {revealedAnswers[q.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#34D399]/5 border border-[#34D399]/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-[#34D399] font-semibold">✓ Answer: {q.answer}</p>
                      <p className="text-xs text-[#888] mt-1 leading-relaxed">{q.explanation}</p>
                    </motion.div>
                  )}
                </DarkCard>
              ))}
            </div>
          )}

          {/* ─── CODING TAB ─── */}
          {activeTab === 'coding' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {['all', 'easy', 'medium', 'hard'].map(f => (
                  <button
                    key={f}
                    onClick={() => setCodingFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                      codingFilter === f ? 'bg-[#818CF8] border-[#818CF8] text-white' : 'bg-black border-[#1A1A1A] text-[#444] hover:text-[#888]'
                    }`}
                  >{f}</button>
                ))}
              </div>
              {filteredCoding?.map((p, i) => (
                <DarkCard key={p.id} delay={i * 0.04}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ color: diffBadge[p.difficulty]?.color, backgroundColor: diffBadge[p.difficulty]?.bg, border: `1px solid ${diffBadge[p.difficulty]?.color}30` }}>{p.difficulty}</span>
                      <span className="text-[10px] text-[#444] font-bold uppercase">{p.topic?.replace('_', ' ')}</span>
                    </div>
                    <a
                      href={`https://leetcode.com/search/?q=${encodeURIComponent(p.title)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-black text-[#818CF8] hover:text-white transition-colors flex items-center gap-1"
                    >Practice →</a>
                  </div>
                  <h4 className="font-black text-white mb-2">{p.title}</h4>
                  <p className="text-sm text-[#888] leading-relaxed mb-3">{p.problem}</p>
                  <button onClick={() => toggleAnswer(p.id)} className="text-[10px] font-black uppercase tracking-widest text-[#818CF8] hover:text-white transition-colors flex items-center gap-1">
                    {revealedAnswers[p.id] ? '▲ Hide' : '▼ Show'} Hint
                  </button>
                  {revealedAnswers[p.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#818CF8]/5 border border-[#818CF8]/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-[#818CF8] font-semibold mb-1">💡 Hint</p>
                      <p className="text-xs text-[#888] leading-relaxed">{p.hint}</p>
                    </motion.div>
                  )}
                </DarkCard>
              ))}
            </div>
          )}

          {/* ─── INTERVIEW TAB ─── */}
          {activeTab === 'interview' && (
            <div className="space-y-4">
              {/* Technical */}
              <div>
                <p className="text-[10px] font-black text-[#818CF8] uppercase tracking-widest mb-3">Technical Questions</p>
                {practiceData.interview?.filter(q => q.type === 'technical').map((q, i) => (
                  <DarkCard key={q.id} delay={i * 0.04} className="mb-3">
                    <p className="text-sm font-semibold text-white leading-relaxed mb-3">{q.question}</p>
                    <button onClick={() => toggleAnswer(q.id)} className="text-[10px] font-black uppercase tracking-widest text-[#818CF8] hover:text-white transition-colors">
                      {revealedAnswers[q.id] ? '▲ Hide' : '▼ Show'} Sample Answer
                    </button>
                    {revealedAnswers[q.id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#818CF8]/5 border border-[#818CF8]/20 rounded-xl px-4 py-3">
                        <p className="text-xs text-[#888] leading-relaxed">{q.sample_answer}</p>
                      </motion.div>
                    )}
                  </DarkCard>
                ))}
              </div>
              {/* HR */}
              <div>
                <p className="text-[10px] font-black text-[#34D399] uppercase tracking-widest mb-3">HR & Behavioral Questions</p>
                {practiceData.interview?.filter(q => q.type === 'hr').map((q, i) => (
                  <DarkCard key={q.id} delay={i * 0.04} className="mb-3">
                    <p className="text-sm font-semibold text-white leading-relaxed mb-3">{q.question}</p>
                    <button onClick={() => toggleAnswer(q.id)} className="text-[10px] font-black uppercase tracking-widest text-[#34D399] hover:text-white transition-colors">
                      {revealedAnswers[q.id] ? '▲ Hide' : '▼ Show'} Framework
                    </button>
                    {revealedAnswers[q.id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#34D399]/5 border border-[#34D399]/20 rounded-xl px-4 py-3">
                        <p className="text-xs text-[#888] leading-relaxed">{q.sample_answer}</p>
                      </motion.div>
                    )}
                  </DarkCard>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tracking Engine — Score Evolution & Progress History
   ══════════════════════════════════════════════════════════════════ */
function TrackingModule() {
  const { user, trackingData, setTrackingData } = useAppContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id && !trackingData) {
      setLoading(true);
      fetchProgress(user.id)
        .then(data => setTrackingData(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, trackingData, setTrackingData]);

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Tracking Engine" subtitle="Loading your progress history..." />
      <DarkCard><div className="flex items-center justify-center py-12"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full" /></div></DarkCard>
    </div>
  );

  const noData = !trackingData || trackingData.total_sessions === 0;

  if (noData) return (
    <div className="space-y-8">
      <PageHeader title="Tracking Engine" subtitle="Your placement score and skill growth over time." />
      <EmptyState icon={BarChart2} title="No Sessions Recorded" message="Complete practice sessions in the Practice Engine to track your score evolution here." />
    </div>
  );

  const evolution = trackingData.score_evolution || [];
  const sessions = trackingData.sessions || [];
  const maxScore = Math.max(...evolution.map(e => e.score), 1);
  const chartW = 600, chartH = 150;

  // Build SVG polyline path
  const points = evolution.map((e, i) => {
    const x = (i / Math.max(evolution.length - 1, 1)) * (chartW - 40) + 20;
    const y = chartH - 10 - ((e.score / 100) * (chartH - 20));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8">
      <PageHeader title="Tracking Engine" subtitle={`${trackingData.total_sessions} sessions recorded · Best score: ${trackingData.best_score}%`} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: trackingData.total_sessions, color: '#F97316', icon: <Award size={16} /> },
          { label: 'Best Score', value: `${trackingData.best_score}%`, color: '#34D399', icon: <TrendingUp size={16} /> },
          { label: 'Latest Score', value: `${trackingData.latest_session?.placement_score?.toFixed(1) || '—'}%`, color: '#818CF8', icon: <Target size={16} /> },
          { label: 'Skills Acquired', value: trackingData.latest_session?.skills_count || 0, color: '#F59E0B', icon: <Zap size={16} /> },
        ].map((s, i) => (
          <DarkCard key={i} delay={i * 0.07}>
            <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>{s.icon}<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#555' }}>{s.label}</span></div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </DarkCard>
        ))}
      </div>

      {/* Score Evolution Chart */}
      {evolution.length > 1 && (
        <DarkCard glow delay={0.1}>
          <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-4">Score Evolution</h4>
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: '300px' }}>
              {/* Grid lines */}
              {[25, 50, 75, 100].map(v => (
                <line key={v} x1="20" y1={chartH - 10 - (v / 100) * (chartH - 20)} x2={chartW - 20} y2={chartH - 10 - (v / 100) * (chartH - 20)} stroke="#1A1A1A" strokeWidth="1" />
              ))}
              {[25, 50, 75, 100].map(v => (
                <text key={v} x="15" y={chartH - 10 - (v / 100) * (chartH - 20) + 4} fontSize="8" fill="#333" textAnchor="end">{v}</text>
              ))}
              {/* Glow fill */}
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                </linearGradient>
              </defs>
              {points && <polyline points={points} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px rgba(249,115,22,0.6))" />}
              {/* Dots */}
              {evolution.map((e, i) => {
                const x = (i / Math.max(evolution.length - 1, 1)) * (chartW - 40) + 20;
                const y = chartH - 10 - ((e.score / 100) * (chartH - 20));
                return <circle key={i} cx={x} cy={y} r="4" fill="#F97316" stroke="#060606" strokeWidth="2" />;
              })}
            </svg>
          </div>
          <div className="flex gap-4 mt-3 overflow-x-auto">
            {evolution.map((e, i) => (
              <div key={i} className="text-center flex-shrink-0">
                <div className="text-sm font-black text-[#F97316]">{e.score}%</div>
                <div className="text-[9px] text-[#444] mt-0.5">{e.date}</div>
              </div>
            ))}
          </div>
        </DarkCard>
      )}

      {/* Sessions Table */}
      <DarkCard delay={0.2}>
        <h4 className="font-black text-sm text-[#F97316] uppercase tracking-widest mb-5">Session History</h4>
        <div className="space-y-3">
          {sessions.slice().reverse().map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                  <Clock size={14} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{s.target_role || 'Unknown Role'}</p>
                  <p className="text-[10px] text-[#555]">{s.date}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                {s.aptitude_score != null && <div className="text-center"><div className="font-black text-[#F97316]">{s.aptitude_score}%</div><div className="text-[#444] text-[9px]">Aptitude</div></div>}
                {s.coding_score != null && <div className="text-center"><div className="font-black text-[#818CF8]">{s.coding_score}%</div><div className="text-[#444] text-[9px]">Coding</div></div>}
                {s.interview_score != null && <div className="text-center"><div className="font-black text-[#34D399]">{s.interview_score}%</div><div className="text-[#444] text-[9px]">Interview</div></div>}
                <div className="text-center"><div className="font-black text-white">{s.placement_score?.toFixed(1) || '—'}%</div><div className="text-[#444] text-[9px]">Overall</div></div>
              </div>
            </motion.div>
          ))}
        </div>
      </DarkCard>

      {/* Outcome Tracking - Validates the intelligence model */}
      <OutcomeTracker userId={user?.id} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Dashboard Component
   ══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, setPreparationData, setPracticeData } = useAppContext();
  const [analyzedData, setAnalyzedData] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const handleAnalyzeComplete = useCallback((data) => {
    setAnalyzedData(data);
    setSelectedRoleIndex(0);
    // Seed engine data from the single upload_resume response
    if (data?.preparation_plan) setPreparationData(data.preparation_plan);
    if (data?.practice_set) setPracticeData(data.practice_set);
  }, [setPreparationData, setPracticeData]);

  const handleReset = () => { setAnalyzedData(null); setActiveTab('overview'); setSelectedRoleIndex(0); setPreparationData(null); setPracticeData(null); };

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

            {/* Module 4: Tracking Engine */}
            <Route path="/tracking" element={<TrackingModule />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
