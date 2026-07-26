import { useState, useRef, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, NavLink, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { aiResult } from '../utils/mockData';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/dashboard/MobileNav';
import UploadBox from '../components/dashboard/UploadBox';
import InsightCards from '../components/dashboard/InsightCards';
import PlacementModule from '../components/placement/PlacementModule';
import SkillBadge from '../components/dashboard/SkillBadge';
import ScoreRing from '../components/dashboard/ScoreRing';
import { RefreshCw, Menu, TrendingUp, Target, Briefcase, Sparkles, ArrowRight, Zap, BookOpen, Code, MessageSquare, CheckCircle, Circle, BarChart2, Award, Clock, FileText, Star, Globe, Search } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { fetchPreparationPlan, fetchPracticeSet, fetchProgress } from '../services/engineApi';
import { generateDossier } from '../services/reportApi';
import OutcomeTracker from '../components/dashboard/OutcomeTracker';
import PlacementEngine from './PlacementEngine';
import MyProfile from './MyProfile';
import ATSChecker from '../components/dashboard/ATSChecker';
import StandaloneATSAnalyzer from '../components/ats/StandaloneATSAnalyzer';

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
      className={`relative rounded-[1.5rem] p-6 overflow-hidden ${className}`}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: glow
          ? '0 0 32px rgba(27,42,74,0.15), 0 4px 32px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.04) inset'
          : '0 4px 32px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(27,42,74,0.25), transparent)' }} />
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
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1B2A4A]/10 border border-[#1B2A4A]/20 text-[#1B2A4A] mb-6 mx-auto shadow-[0_0_30px_rgba(27,42,74,0.15)]"
      >
        <Icon size={28} />
      </motion.div>
      <h3 className="text-[#1B2A4A] font-black text-xl mb-2">{title}</h3>
      <p className="text-[#888888] text-sm max-w-xs mx-auto leading-relaxed">{message}</p>
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
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-7 rounded-full bg-[#1B2A4A] shadow-[0_0_12px_rgba(27,42,74,0.6)]" />
        <h2 className="text-3xl font-black text-[#1B2A4A] tracking-tighter">{title}</h2>
      </div>
      <p className="text-[#666] text-sm font-medium ml-4">{subtitle}</p>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   Sub-page: ATS Checker
══════════════════════════════════════════════════════════════════ */
function AtsCheckerPage({ data, setAtsResultData, setJdResultData }) {
  if (!data) return (
    <div>
      <PageHeader title="Resume Intelligence" subtitle="4-engine AI analysis: JOB MODE Benchmark, Role Alignment, Actionable Fixes & JD Matcher" />
      <EmptyState icon={FileText} title="No Analysis Yet" message="Go to Overview and upload your resume first." />
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Resume Intelligence" subtitle="4-engine AI analysis: JOB MODE Benchmark • Role Alignment • Actionable Fixes • JD Matcher" />
      <StandaloneATSAnalyzer
        data={data}
        onIntelReady={(intel) => {
          if (intel && setAtsResultData) {
            setAtsResultData({
              overall_ats_score: intel.overall_ats_score,
              overall_score:     intel.overall_ats_score,
              grade:             intel.grade,
              grade_description: intel.grade_description,
              breakdown:         intel.breakdown,
              missing_skills:    intel.missing_skills || [],
              feedback:          intel.grade_description,
            });
          }
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Sub-page: Analysis
══════════════════════════════════════════════════════════════════ */

function AnalysisPage({ data, setAtsResultData, setJdResultData }) {
  if (!data) return (
    <div>
      <PageHeader title="Resume Analysis" subtitle="Deep extraction of your skills and career signals." />
      <EmptyState icon={FileText} title="No Analysis Yet" message="Go to Overview and upload your resume first." />
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Resume Analysis" subtitle="Deep extraction of your skills and career signals." />

      {/* Stat cards — 3-col bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Big skill count */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #1B2A4A, transparent)' }} />
          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>Skills Detected</p>
          <p className="text-5xl font-black text-[#1B2A4A] mb-2">{data.allDetected?.length || 0}</p>
          <p className="text-[11px]" style={{ color: '#888888' }}>Extracted from your resume</p>
        </div>
        {/* Role matches */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #34D399, transparent)' }} />
          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>Role Matches</p>
          <p className="text-5xl font-black mb-2" style={{ color: '#34D399' }}>{data.jobRoles?.length || 0}</p>
          <p className="text-[11px]" style={{ color: '#888888' }}>Career paths identified</p>
        </div>
        {/* Gap count */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #F87171, transparent)' }} />
          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>Skill Gaps</p>
          <p className="text-5xl font-black mb-2" style={{ color: '#F87171' }}>{data.missing?.length || 0}</p>
          <p className="text-[11px]" style={{ color: '#888888' }}>Skills to acquire</p>
        </div>
      </div>

      {/* Skills grid */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #1B2A4A, transparent)' }} />
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1B2A4A' }}>All Detected Skills</p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(27,42,74,0.1)', border: '1px solid rgba(27,42,74,0.25)', color: '#1B2A4A' }}>{data.allDetected?.length} total</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(data.allDetected || []).map((skill, i) => (
            <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(27,42,74,0.08)', border: '1px solid rgba(27,42,74,0.2)', color: '#1B2A4A' }}>
              {skill}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Role match bars */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #1B2A4A, transparent)' }} />
        <p className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: '#1B2A4A' }}>Role Match Breakdown</p>
        <div className="space-y-3">
          {(data.jobRoles || []).filter(role => role.match > 0).map((role, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#1B2A4A] w-40 truncate flex-shrink-0">{role.title || role.role}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: '#E4DED0' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${role.match}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: i * 0.08 }}
                  className="h-full rounded-full"
                  style={{ background: '#1B2A4A' }} />
              </div>
              <span className="text-xs font-black w-9 text-right" style={{ color: '#1B2A4A' }}>{role.match}%</span>
            </div>
          ))}
        </div>
      </div>
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
        <p className="text-[10px] text-[#888888] italic mb-2">The % indicates the match confidence based on your resume.</p>
        <div className="flex flex-wrap gap-2 pb-2">
          {roles.map((role, idx) => {
            return (
              <motion.button
                key={idx}
                onClick={() => setSelectedRoleIndex(idx)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all outline-none cursor-pointer ${
                  selectedRoleIndex === idx
                    ? 'bg-[#1B2A4A] text-white shadow-md border border-[#1B2A4A]'
                    : 'bg-transparent text-[#888888] border border-[#C9C2AF] hover:border-[#1B2A4A]/30 hover:text-[#1B2A4A]'
                }`}
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
            <h5 className="font-black text-sm text-[#1B2A4A]">Skills You Have</h5>
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
                <p className="text-xs text-[#888888]">No matching skills found for this role yet.</p>
                <p className="text-[10px] text-[#888888] mt-1">Try selecting a different role or add more skills to your resume.</p>
              </div>
            )}
          </div>
        </DarkCard>

        <DarkCard delay={0.1}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-full bg-[#1B2A4A] shadow-[0_0_12px_rgba(27,42,74,0.8)]" />
            <h5 className="font-black text-sm text-[#1B2A4A]">Skills to Learn</h5>
            <span className="ml-auto text-xs font-black text-[#1B2A4A] bg-[#1B2A4A]/10 border border-[#1B2A4A]/20 px-2.5 py-1 rounded-full">
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
                  className="flex items-center justify-between bg-[#1B2A4A]/5 border border-[#1B2A4A]/15 px-4 py-3 rounded-xl hover:border-[#1B2A4A]/25 transition-colors"
                >
                  <span className="text-sm font-semibold text-orange-300">{s}</span>
                  <span className="text-[10px] font-black text-[#1B2A4A] bg-[#1B2A4A]/10 border border-[#1B2A4A]/20 px-2 py-0.5 rounded-full">📚 Learn</span>
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
   Sub-page: Score — Reference-match bento layout
══════════════════════════════════════════════════════════════════ */
function ArcGauge({ value = 0, color = '#1B2A4A', size = 140 }) {
  const r = 52, cx = size / 2, cy = size / 2 + 14;
  const arc = (pct) => {
    const a = Math.PI + pct * Math.PI;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const bg = arc(1), fg = arc(Math.min(value, 100) / 100);
  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#C9C2AF" strokeWidth="10" strokeLinecap="round" />
      {value > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${fg.x} ${fg.y}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      )}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="32" fontWeight="900" fill="#1B2A4A">{value}%</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10" fontWeight="800" fill="#666" style={{ letterSpacing: '0.05em' }}>PROFILE STRENGTH</text>
    </svg>
  );
}

function BarRow({ label, value, color = '#1B2A4A', max = 100 }) {
  // Minimum visible fill: if value > 0 use at least 4px; we express this via minWidth on the inner bar
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold w-20 sm:w-24 flex-shrink-0" style={{ color: '#6B6B63' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E4DED0' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct > 0 ? `max(4px, ${pct}%)` : '0%' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-black w-10 flex-shrink-0 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function ScorePage({ data }) {
  if (!data) return (
    <div>
      <PageHeader title="Profile Strength Index" subtitle="Upload your resume to get your personalized readiness score." />
      <EmptyState icon={TrendingUp} title="No Score Yet" message="Upload your resume on Overview first." />
    </div>
  );

  const dims = [
    { label: 'Skills Breadth',    value: Math.min(100, Math.round((data.allDetected?.length || 0) / 15 * 100)), color: '#1B2A4A' },
    { label: 'Work Experience',   value: 75, color: '#1B2A4A' },
    { label: 'Project Portfolio', value: Math.min(100, (data.jobRoles?.length || 0) * 15), color: '#1B2A4A' },
    { label: 'Certifications',    value: 60, color: '#1B2A4A' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Strength Index" subtitle="Your career readiness metrics across multiple dimensions." />

      {/* TOP ROW — Responsive Grid (1 col on mobile, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Big score card with arc gauge */}
        <div className="rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #1B2A4A, transparent)' }} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[#888888]">Overall Readiness</p>
          <ArcGauge value={data.score} color="#1B2A4A" size={180} />
          <div className="mt-4 flex gap-5 text-center">
            <div><p className="text-[9px] font-black text-[#888888] uppercase tracking-widest">Confidence</p><p className="text-sm font-black text-[#1B2A4A]">{Math.round(data.score * 0.9)}%</p></div>
            <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div><p className="text-[9px] font-black text-[#888888] uppercase tracking-widest">Uncertainty</p><p className="text-sm font-black text-[#F59E0B]">MEDIUM</p></div>
          </div>
        </div>

        {/* Interview Confidence card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #818CF8, transparent)' }} />
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-[#888888]">Interview Confidence</p>
              <p className="text-5xl font-black text-[#818CF8]" style={{ textShadow: '0 0 25px rgba(129,140,248,0.3)' }}>{data.interview_confidence}%</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1B2A4A]/3 border border-[#1B2A4A]/5">
              <MessageSquare size={16} className="text-[#888888]" />
            </div>
          </div>
          <p className="text-[11px] mb-6 text-[#888888]">Communication & technical depth assessment</p>
          <div className="space-y-4">
            <BarRow label="Communication" value={Math.min(100, data.interview_confidence + 5)} color="#1B2A4A" />
            <BarRow label="Tech Depth" value={data.technical_depth} color="#1B2A4A" />
            <BarRow label="Clarity" value={Math.min(100, data.interview_confidence - 5)} color="#1B2A4A" />
          </div>
        </div>

        {/* Technical Depth card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #34D399, transparent)' }} />
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-[#888888]">Technical Depth</p>
              <p className="text-5xl font-black text-[#34D399]" style={{ textShadow: '0 0 25px rgba(52,211,153,0.3)' }}>{data.technical_depth}%</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1B2A4A]/3 border border-[#1B2A4A]/5">
              <Code size={16} className="text-[#888888]" />
            </div>
          </div>
          <p className="text-[11px] mb-6 text-[#888888]">Engineering fundamentals & algorithmic strength</p>
          <div className="space-y-4">
            <BarRow label="Algorithms" value={Math.min(100, data.technical_depth + 3)} color="#1B2A4A" />
            <BarRow label="Systems" value={Math.max(0, data.technical_depth - 10)} color="#1B2A4A" />
            <BarRow label="Databases" value={Math.min(100, data.technical_depth + 7)} color="#1B2A4A" />
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — 2 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension breakdown */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(27,42,74,0.3), transparent)' }} />
          <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-[#1B2A4A]">Dimension Breakdown</p>
          <div className="space-y-5">
            {dims.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-[#1B2A4A]/90">{d.label}</span>
                  <span className="text-xs font-black" style={{ color: d.color }}>{d.value}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.value}%` }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 + i * 0.08 }}
                    className="h-full rounded-full" style={{ background: d.color, boxShadow: `0 0 12px ${d.color}40` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Target companies */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(27,42,74,0.3), transparent)' }} />
          <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-[#1B2A4A]">Target Match Clusters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data.companies || []).map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[#1B2A4A]/3 transition-colors"
                style={{ background: '#C9C2AF', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                    style={{ background: 'rgba(27,42,74,0.1)', border: '1px solid rgba(27,42,74,0.2)', color: '#1B2A4A' }}>
                    {c[0]}
                  </div>
                  <span className="text-xs font-bold text-[#1B2A4A]/80">{c}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
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
    const hasData = (ai.inferred_skills?.length > 0 || ai.strengths?.length > 0 || ai.weaknesses?.length > 0);
    
    if (hasData) {
      finalEnhancements = [
        ...(ai.inferred_skills || []).map(s => ({ txt: s, type: 'inferred' })),
        ...(ai.strengths || []).map(s => ({ txt: s, type: 'strength' })),
        ...(ai.weaknesses || []).map(s => ({ txt: s, type: 'weakness' }))
      ];
    }
  }

  // Use Dynamic LLM Learning Path if available (Logic handled below)


  const aiInsights = data?.llm_insights || {};
  const learningPath = aiInsights.learning_path?.length > 0 ? aiInsights.learning_path : data?.recommendations || ["Master Node.js to improve your Full Stack Developer readiness", "Master REST API to improve your Full Stack Developer readiness", "Master TypeScript to improve your Full Stack Developer readiness"];
  
  const defaultJobs = [
    { title: "Full Stack Engineer", reason: "Strong alignment with core web development patterns detected in your profile." },
    { title: "Software Development Engineer", reason: "Your technical depth score indicates readiness for standard SDE roles." }
  ];
  // ── Live Job Recommendations from AI Engine ──────────────────────────
  const [liveJobs, setLiveJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsEngine, setJobsEngine] = useState('');

  useEffect(() => {
    const skills = data?.allDetected || data?.skills || [];
    if (!skills.length) return;
    setJobsLoading(true);
    fetch('http://localhost:8000/api/recommendations/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills, top_n: 6 }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.jobs) {
          setLiveJobs(d.jobs);
          setJobsEngine(d.engine || '');
        }
      })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [data?.allDetected]);

  const personalizedJobs = liveJobs.length > 0
    ? liveJobs.map(j => ({ title: j.title, reason: j.reason, match_score: j.match_score, matched_skills: j.matched_skills || [], company_type: j.company_type, domain: j.domain }))
    : (aiInsights.personalized_jobs?.length > 0 ? aiInsights.personalized_jobs : defaultJobs);
  
  const defaultTips = [
    "Focus on explaining your project architecture clearly.",
    "Be ready to discuss trade-offs in your technical decisions.",
    "Practice behavioral questions using the STAR method."
  ];
  const interviewTips = aiInsights.interview_tips?.length > 0 ? aiInsights.interview_tips : defaultTips;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setRecTab('resume')}
          className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all outline-none ${
            recTab === 'resume'
              ? 'bg-[#1B2A4A] text-white shadow-md border border-[#1B2A4A]'
              : 'bg-transparent text-[#888888] border border-[#C9C2AF] hover:border-[#1B2A4A]/30 hover:text-[#1B2A4A]'
          }`}
        >
          Resume Insights
        </button>
        <button
          onClick={() => setRecTab('career')}
          className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all outline-none ${
            recTab === 'career'
              ? 'bg-[#1B2A4A] text-white shadow-md border border-[#1B2A4A]'
              : 'bg-transparent text-[#888888] border border-[#C9C2AF] hover:border-[#1B2A4A]/30 hover:text-[#1B2A4A]'
          }`}
        >
          Career Roadmap
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
            <div className="space-y-6">
              {/* AI-Inferred Potential — full width */}
              <DarkCard glow>
                <h4 className="font-black text-sm text-[#1B2A4A] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#1B2A4A]" />
                  Resume Insights
                </h4>

                {/* Section 1: Skills Identified */}
                {finalEnhancements.filter(i => i.type === 'strength').length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#27500A] bg-[#EAF3DE] border border-[#97C459] px-2.5 py-1 rounded-full">
                        ✓ Skills Identified
                      </span>
                      <div className="flex-1 h-px bg-[#E4DED0]" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {finalEnhancements.filter(i => i.type === 'strength').map((item, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-3 py-1.5 rounded-full border"
                          style={{ background: '#EAF3DE', borderColor: '#97C459', color: '#27500A' }}>
                          {item.txt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Areas to Strengthen */}
                {finalEnhancements.filter(i => i.type === 'weakness').length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#791F1F] bg-[#FCEBEB] border border-[#F09595] px-2.5 py-1 rounded-full">
                        ✗ Areas to Strengthen
                      </span>
                      <div className="flex-1 h-px bg-[#E4DED0]" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {finalEnhancements.filter(i => i.type === 'weakness').map((item, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-3 py-1.5 rounded-full border"
                          style={{ background: '#FCEBEB', borderColor: '#F09595', color: '#791F1F' }}>
                          {item.txt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Resume Writing Tips */}
                {finalEnhancements.filter(i => i.type === 'inferred').length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0C447C] bg-[#E6F1FB] border border-[#378ADD] px-2.5 py-1 rounded-full">
                        ✎ Resume Writing Tips
                      </span>
                      <div className="flex-1 h-px bg-[#E4DED0]" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {finalEnhancements.filter(i => i.type === 'inferred').map((item, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-3 py-1.5 rounded-full border"
                          style={{ background: '#E6F1FB', borderColor: '#378ADD', color: '#0C447C' }}>
                          {item.txt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </DarkCard>

              {/* Executive Career Assessment — full width, below AI-Inferred Potential */}
              {(() => {
                const ei = data?.executive_intelligence;
                const ea = ei?.executive_assessment;
                const cip = ei?.candidate_intelligence_profile;
                const hasEA = ea && ea.sections;
                const legacyAdvice = aiInsights.career_advice ||
                  'Based on your technical depth, you are showing strong aptitude for high-scale systems. Focus on bridging the architectural gaps highlighted in your roadmap.';

                return (
                  <DarkCard glow className="bg-gradient-to-br from-[#1B2A4A]/5 via-[#818CF8]/5 to-transparent">
                    {/* Card header row */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#1B2A4A] to-[#818CF8] shadow-[0_0_10px_rgba(27,42,74,0.4)]" />
                          <h4 className="font-black text-sm text-[#1B2A4A] uppercase tracking-widest">
                            Executive Career Assessment
                          </h4>
                        </div>
                        <p className="text-[9px] text-[#888888] ml-3.5">
                          {hasEA
                            ? (ea.source === 'llm' ? '✦ AI Recruiter Intelligence · Structured Platform Analysis' : '◈ Platform Intelligence · Data-Grounded Assessment')
                            : '◈ Career Intelligence'}
                        </p>
                      </div>
                      {cip && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                            style={{ background: 'rgba(27,42,74,0.1)', border: '1px solid rgba(27,42,74,0.2)', color: '#1B2A4A' }}>
                            {cip.candidate?.stage || 'Emerging'}
                          </span>
                          <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                            style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818CF8' }}>
                            {cip.candidate?.recruiter_confidence || 'Moderate'} Recruiter Confidence
                          </span>
                          <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                            {cip.candidate?.persona?.replace(' Candidate','') || 'Engineering'}
                          </span>
                        </div>
                      )}
                    </div>

                    {hasEA ? (
                      <>
                        {/* 5-section grid layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                          {[
                            { key: 'executive_overview',   label: 'Executive Overview',   color: '#1B2A4A', span: 'lg:col-span-2' },
                            { key: 'technical_capability', label: 'Technical Capability', color: '#818CF8', span: '' },
                            { key: 'resume_quality',       label: 'Resume Quality',       color: '#34D399', span: '' },
                            { key: 'placement_outlook',    label: 'Placement Outlook',    color: '#F59E0B', span: '' },
                            { key: 'recruiter_verdict',    label: 'Recruiter Verdict',    color: '#F87171', span: 'lg:col-span-2' },
                          ].map(({ key, label, color, span }) => {
                            const text = ea.sections?.[key];
                            if (!text) return null;
                            return (
                              <div key={key} className={`p-4 rounded-2xl ${span}`}
                                style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                                <span className="text-[9px] font-black uppercase tracking-widest mb-2 block"
                                  style={{ color }}>{label}</span>
                                <p className="text-[11px] text-[#444441] leading-relaxed font-medium">{text}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* CIP metrics strip */}
                        {cip && (
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-5 border-t border-[#1B2A4A]/10">
                            {[
                              { label: 'JOB MODE Score',      value: `${cip.resume?.ats_quality ?? '—'}`,                 color: '#27500A' },
                              { label: 'Role Match',     value: `${cip.role?.primary_match_pct ?? '—'}%`,            color: '#1B2A4A' },
                              { label: 'Tech Depth',     value: `${Math.round(cip.technical?.depth_pct ?? 0)}%`,     color: '#0C447C' },
                              { label: 'Skill Breadth',  value: `${cip.skills?.breadth ?? '—'}`,                    color: '#854F0B' },
                              { label: 'Utilization',    value: `${cip.skills?.utilization_pct ?? '—'}%`,            color: '#27500A' },
                              { label: 'Interview',      value: `${cip.technical?.interview_readiness_pct ?? '—'}%`, color: '#0C447C' },
                              { label: 'Gaps',           value: `${cip.gaps?.total_count ?? '—'}`,                   color: '#791F1F' },
                              { label: 'Portfolio',      value: cip.portfolio?.strength ?? '—',                      color: '#1B2A4A' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="text-center px-2 py-2 rounded-xl"
                                style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
                                <div className="text-sm font-black" style={{ color }}>{value}</div>
                                <div className="text-[8px] text-[#6B6B63] uppercase tracking-wider mt-0.5">{label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback when executive_intelligence not yet available */
                      <div className="py-4">
                        <p className="text-xs text-[#6B6B63] leading-relaxed italic mb-4">
                          &ldquo;{legacyAdvice}&rdquo;
                        </p>
                        {cip && (
                          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1B2A4A]/5">
                            {[
                              { label: 'JOB MODE Score',  value: `${cip.resume?.ats_quality ?? '—'}`,             color: '#34D399' },
                              { label: 'Role Match', value: `${cip.role?.primary_match_pct ?? '—'}%`,        color: '#1B2A4A' },
                              { label: 'Tech Depth', value: `${Math.round(cip.technical?.depth_pct ?? 0)}%`, color: '#818CF8' },
                              { label: 'Gaps',       value: `${cip.gaps?.total_count ?? '—'}`,               color: '#F87171' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="text-center px-2 py-2 rounded-xl"
                                style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
                                <div className="text-sm font-black" style={{ color }}>{value}</div>
                                <div className="text-[8px] text-[#888888] uppercase tracking-wider mt-0.5">{label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </DarkCard>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Personalized Jobs & Market Trends */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobsLoading ? (
                    <div className="col-span-2 flex items-center gap-3 p-6">
                      <div className="w-5 h-5 border-2 border-[#1B2A4A]/30 border-t-[#1B2A4A] rounded-full animate-spin" />
                      <span className="text-xs text-[#888888]">Finding best matches using {jobsEngine || 'AI'} engine...</span>
                    </div>
                  ) : personalizedJobs.length > 0 ? personalizedJobs.map((job, i) => (
                    <DarkCard key={i} className="group hover:border-[#1B2A4A]/50 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-sm text-[#1B2A4A] group-hover:text-[#1B2A4A] transition-colors">{job.title}</h5>
                        <div className="flex flex-col items-end gap-1">
                          {job.match_score > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(27,42,74,0.12)', border: '1px solid rgba(27,42,74,0.25)', color: '#1B2A4A' }}>
                              {job.match_score}% match
                            </span>
                          )}
                          {job.domain && (
                            <span className="text-[9px] text-[#888888] uppercase tracking-wider">{job.domain}</span>
                          )}
                        </div>
                      </div>
                      {job.matched_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {job.matched_skills.slice(0, 3).map((s, si) => (
                            <span key={si} className="text-[9px] font-black px-2 py-1 rounded-full bg-[#34D399]/10 border border-[#34D399]/30 text-[#34D399]">{s}</span>
                          ))}
                          {job.matched_skills.length > 3 && (
                            <span className="text-[9px] text-[#888888]">+{job.matched_skills.length - 3} more</span>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-[#888888] leading-relaxed">{job.reason}</p>
                    </DarkCard>
                  )) : (
                    <div className="col-span-2 text-xs text-[#888888] italic">AI is generating specific matches...</div>
                  )}
                </div>

                <DarkCard>
                   <h4 className="font-black text-[10px] text-[#1B2A4A] uppercase mb-4 flex items-center gap-2">
                     <Globe className="w-3 h-3" /> Industry Trends
                   </h4>
                   <p className="text-xs text-[#888888555] leading-relaxed">
                     {aiInsights.industry_trends || "Companies are increasingly looking for Full-Stack capability combined with specialized AI tool proficiency."}
                   </p>
                </DarkCard>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   {interviewTips.map((tip, i) => (
                     <div key={i} className="p-3 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #C9C2AF' }}>
                        <span className="text-[10px] font-black text-[#888888] uppercase block mb-1">Tip {i+1}</span>
                        <p className="text-[10px] text-[#1B2A4A] leading-tight">{tip}</p>
                     </div>
                   ))}
                </div>
              </div>

              {/* Right Column: Learning Roadmap (Denser View) */}
              <div className="lg:col-span-1">
                <DarkCard glow className="h-full">
                  <h4 className="font-black text-[10px] text-[#1B2A4A] uppercase mb-6 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Learning Path
                  </h4>
                  <div className="space-y-4 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[#1B2A4A]/30 to-transparent" />
                    {learningPath.map((step, i) => (
                      <div key={i} className="relative flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-[#FFFFFF] border border-[#1B2A4A]/30 text-[10px] font-black text-[#1B2A4A] flex items-center justify-center flex-shrink-0 z-10">
                          {i+1}
                        </div>
                        <p className="text-[11px] text-[#888888555] mt-1 leading-tight">{step}</p>
                      </div>
                    ))}
                  </div>
                </DarkCard>
              </div>
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
   Modules Hub: The Entry View — Reference-match bento cards
   ══════════════════════════════════════════════════════════════════ */
function ModulesHub() {
  const navigate = useNavigate();
  const { preparationData, practiceData } = useAppContext();

  const engines = [
    {
      id: 'profile',
      title: 'Profile Intelligence',
      desc: 'Understand your market fit. Resume parsing, skill extraction, and profile strength scoring.',
      icon: Target,
      color: '#1B2A4A',
      path: '/dashboard/profile',
      status: 'Live',
      statusClass: 'badge-live',
    },
    {
      id: 'prep',
      title: 'Preparation Engine',
      desc: 'Dynamic learning roadmap. Skill gaps converted to prioritized, topic-level action plans.',
      icon: BookOpen,
      color: '#34D399',
      path: '/dashboard/preparation',
      status: preparationData ? 'Loaded' : 'Ready',
      statusClass: preparationData ? 'badge-loaded' : 'badge-ready',
    },
    {
      id: 'practice',
      title: 'Practice Engine',
      desc: 'Role-specific aptitude, DSA coding problems, and technical + HR interview questions.',
      icon: Sparkles,
      color: '#818CF8',
      path: '/dashboard/practice',
      status: practiceData ? 'Loaded' : 'Live',
      statusClass: practiceData ? 'badge-loaded' : 'badge-live',
    },
    {
      id: 'placement',
      title: 'Placement Engine',
      desc: 'Drives & Applications. View active placement drives and submit your candidacy.',
      icon: Briefcase,
      color: '#1B2A4A',
      path: '/dashboard/placement',
      status: 'Live',
      statusClass: 'badge-live',
    },
    {
      id: 'tracking',
      title: 'Tracking Engine',
      desc: 'Score evolution charts, session history, and a feedback loop that improves your prediction.',
      icon: BarChart2,
      color: '#F59E0B',
      path: '/dashboard/tracking',
      status: 'Live',
      statusClass: 'badge-live',
    },
  ];
  return (
    <div className="space-y-8">
      <PageHeader title="Intelligence Modules" subtitle="Choose an engine to accelerate your placement journey." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {engines.map((engine, i) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => navigate(engine.path)}
            className="group cursor-pointer relative overflow-hidden rounded-[20px] flex flex-col animate-breathing"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E4DED0',
              padding: '22px',
              minHeight: '200px',
              boxShadow: '0 4px 20px rgba(27,42,74,0.08)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(27,42,74,0.25)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E4DED0'}
          >
            {/* Top accent shimmer */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(to right, transparent, ${engine.color}40, transparent)` }} />

            {/* Header: icon box + status badge */}
            <div className="flex items-start justify-between mb-5">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${engine.color}18`,
                  border: `1px solid ${engine.color}30`,
                }}
              >
                <engine.icon size={22} style={{ color: engine.color }} />
              </motion.div>

              <span className={engine.statusClass}>{engine.status}</span>
            </div>

            {/* Title + description */}
            <h3
              className="font-black text-[#1B2A4A] mb-2 leading-snug"
              style={{ fontSize: '15px', transition: 'color 0.15s' }}
            >
              {engine.title}
            </h3>
            <p className="text-xs leading-relaxed flex-1" style={{ color: '#888888' }}>
              {engine.desc}
            </p>

            {/* Bottom CTA — always visible, reference style */}
            <div className="flex items-center gap-1.5 mt-5 text-[10px] font-black uppercase tracking-[0.1em]" style={{ color: engine.color }}>
              Enter Engine
              <ArrowRight size={11} />
            </div>
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
  return <PreparationContent />;
}

function PreparationContent() {
  const { user, analyzedData, preparationData, setPreparationData } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prep_completed') || '[]'); } catch { return []; }
  });

  const tierConfig = {
    programming: { label: 'Programming Fundamentals', color: '#1B2A4A', glow: 'rgba(27,42,74,0.15)' },
    dsa:         { label: 'DSA & Algorithms',         color: '#818CF8', glow: 'rgba(129,140,248,0.15)' },
    core_cs:     { label: 'Core CS Concepts',          color: '#34D399', glow: 'rgba(52,211,153,0.15)' },
    domain:      { label: 'Domain Specific',           color: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
  };

  const priorityColors = { high: '#1B2A4A', medium: '#818CF8', low: '#34D399' };
  const priorityLabels = { high: 'Critical', medium: 'Recommended', low: 'Bonus' };

  const toggleTopic = useCallback((topic) => {
    setCompletedTopics(prev => {
      const isAdding = !prev.includes(topic);
      const updated = isAdding ? [...prev, topic] : prev.filter(t => t !== topic);
      localStorage.setItem('prep_completed', JSON.stringify(updated));
      
      // Record a session event if we are marking as complete
      if (isAdding && user?.id) {
        import('../services/engineApi').then(api => {
          api.recordSession({
            user_id: user.id,
            placement_score: analyzedData?.score || 0,
            target_role: preparationData?.target_role || "Skill Mastery",
            completed_topics: [topic]
          }).catch(err => console.error("Topic record failed:", err));
        });
      }
      
      return updated;
    });
  }, [user, analyzedData, preparationData]);

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
            <h4 className="font-black text-sm text-[#1B2A4A] uppercase tracking-widest">Overall Roadmap Progress</h4>
            <p className="text-xs text-[#888888] mt-1">{plan.total_gaps} skills to acquire · ~{plan.estimated_weeks} weeks estimated</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#1B2A4A]">{progressPct}%</span>
            <p className="text-xs text-[#888888]">topics mastered</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.02)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-[#1B2A4A] shadow-[0_0_10px_rgba(27,42,74,0.5)]"
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
                <h4 className="font-black text-sm text-[#1B2A4A] tracking-widest uppercase">{conf.label}</h4>
                <span className="ml-auto text-[10px] font-black px-2 py-1 rounded-full border" style={{ color: conf.color, borderColor: `${conf.color}40`, backgroundColor: `${conf.color}10` }}>
                  {items.length} skills
                </span>
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#C9C2AF' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors[item.priority] || '#888888', boxShadow: `0 0 6px ${priorityColors[item.priority]}80` }} />
                      <span className="text-sm font-bold text-[#1B2A4A] flex-1">{item.skill}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ color: priorityColors[item.priority], backgroundColor: `${priorityColors[item.priority]}15`, border: `1px solid ${priorityColors[item.priority]}30` }}>
                        {priorityLabels[item.priority]}
                      </span>
                    </div>
                    <div className="px-4 py-2 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {item.topics?.map((topic, ti) => {
                        const done = completedTopics.includes(topic);
                        return (
                          <button
                            key={ti}
                            onClick={() => toggleTopic(topic)}
                            className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs transition-all ${
                              done ? 'text-[#34D399]' : 'text-[#888888] hover:text-[#888888555]'
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
    { id: 'aptitude',  label: 'Aptitude',  icon: <Target size={14} />,        color: '#1B2A4A' },
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
  const catColors = { quantitative: '#1B2A4A', logical_reasoning: '#818CF8', verbal: '#34D399' };

  const filteredCoding = codingFilter === 'all'
    ? practiceData.coding
    : practiceData.coding?.filter(p => p.difficulty === codingFilter);

  return (
    <div className="space-y-6">
      <PageHeader title="Practice Engine" subtitle={`Role: ${practiceData.target_role} · ${practiceData.stats?.total_coding || 0} coding · ${practiceData.stats?.total_aptitude || 0} aptitude · ${practiceData.stats?.total_interview || 0} interview`} />

      {/* Stats Bar — reference big-number style */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aptitude',  sub: 'Questions',  count: practiceData.stats?.total_aptitude || 0,  color: '#1B2A4A' },
          { label: 'Coding',    sub: 'Problems',   count: practiceData.stats?.total_coding || 0,    color: '#818CF8' },
          { label: 'Interview', sub: 'Questions',  count: practiceData.stats?.total_interview || 0, color: '#34D399' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="relative rounded-2xl p-5 overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${s.color}50, transparent)` }} />
            <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>{s.label}</p>
            <p className="text-4xl font-black" style={{ color: s.color, textShadow: `0 0 20px ${s.color}40` }}>{s.count}</p>
            <p className="text-[11px] mt-1" style={{ color: '#888888' }}>{s.sub} ready</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl p-1 w-fit" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === tab.id ? 'text-white' : 'text-[#6B6B63] hover:text-[#1B2A4A]'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="practice-tab-pill" className="absolute inset-0 rounded-xl" style={{ backgroundColor: tab.color, boxShadow: `0 0 15px ${tab.color}40` }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
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
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ backgroundColor: 'rgba(27,42,74,0.08)', color: '#1B2A4A', border: '1px solid rgba(27,42,74,0.2)' }}>{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#1B2A4A]">{q.category?.replace('_', ' ')}</span>
                      <p className="text-sm font-semibold text-[#1B2A4A] mt-1 leading-relaxed">{q.question}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options?.map((opt, oi) => (
                      <div key={oi} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        revealedAnswers[q.id] && opt.startsWith(q.answer)
                          ? 'bg-[#EAF3DE] border-[#97C459] text-[#27500A]'
                          : 'bg-[#FFFFFF] border-[#C9C2AF] text-[#1B2A4A] hover:bg-[#F4EFE4]'
                      }`}>{opt}</div>
                    ))}
                  </div>
                  <button onClick={() => toggleAnswer(q.id)} className="text-[10px] font-black uppercase tracking-widest text-[#1B2A4A] hover:text-[#2C3E63] transition-colors flex items-center gap-1">
                    {revealedAnswers[q.id] ? '▲ Hide' : '▼ Reveal'} Answer
                  </button>
                  {revealedAnswers[q.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#EAF3DE] border border-[#97C459] rounded-xl px-4 py-3">
                      <p className="text-xs text-[#27500A] font-bold">✓ Answer: {q.answer}</p>
                      <p className="text-xs text-[#444441] mt-1 leading-relaxed">{q.explanation}</p>
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
                  <button key={f} onClick={() => setCodingFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                      codingFilter === f ? 'bg-[#818CF8] border-[#818CF8] text-[#1B2A4A]' : 'text-[#888888] hover:text-[#888888555]'
                    }`}
                    style={codingFilter !== f ? { background: '#FFFFFF', borderColor: '#C9C2AF' } : {}}>
                    {f}
                  </button>
                ))}
              </div>
              {filteredCoding?.map((p, i) => (
                <DarkCard key={p.id} delay={i * 0.04}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ color: diffBadge[p.difficulty]?.color, backgroundColor: diffBadge[p.difficulty]?.bg, border: `1px solid ${diffBadge[p.difficulty]?.color}30` }}>{p.difficulty}</span>
                      <span className="text-[10px] text-[#888888] font-bold uppercase">{p.topic?.replace('_', ' ')}</span>
                    </div>
                    <a
                      href={`https://leetcode.com/search/?q=${encodeURIComponent(p.title)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-black text-[#818CF8] hover:text-[#1B2A4A] transition-colors flex items-center gap-1"
                    >Practice →</a>
                  </div>
                  <h4 className="font-black text-[#1B2A4A] mb-2">{p.title}</h4>
                  <p className="text-sm text-[#888888555] leading-relaxed mb-3">{p.problem}</p>
                  <button onClick={() => toggleAnswer(p.id)} className="text-[10px] font-black uppercase tracking-widest text-[#818CF8] hover:text-[#1B2A4A] transition-colors flex items-center gap-1">
                    {revealedAnswers[p.id] ? '▲ Hide' : '▼ Show'} Hint
                  </button>
                  {revealedAnswers[p.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#818CF8]/5 border border-[#818CF8]/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-[#818CF8] font-semibold mb-1">💡 Hint</p>
                      <p className="text-xs text-[#888888555] leading-relaxed">{p.hint}</p>
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
                    <p className="text-sm font-semibold text-[#1B2A4A] leading-relaxed mb-3">{q.question}</p>
                    <button onClick={() => toggleAnswer(q.id)} className="text-[10px] font-black uppercase tracking-widest text-[#818CF8] hover:text-[#1B2A4A] transition-colors">
                      {revealedAnswers[q.id] ? '▲ Hide' : '▼ Show'} Sample Answer
                    </button>
                    {revealedAnswers[q.id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#818CF8]/5 border border-[#818CF8]/20 rounded-xl px-4 py-3">
                        <p className="text-xs text-[#888888555] leading-relaxed">{q.sample_answer}</p>
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
                    <p className="text-sm font-semibold text-[#1B2A4A] leading-relaxed mb-3">{q.question}</p>
                    <button onClick={() => toggleAnswer(q.id)} className="text-[10px] font-black uppercase tracking-widest text-[#34D399] hover:text-[#1B2A4A] transition-colors">
                      {revealedAnswers[q.id] ? '▲ Hide' : '▼ Show'} Framework
                    </button>
                    {revealedAnswers[q.id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-[#34D399]/5 border border-[#34D399]/20 rounded-xl px-4 py-3">
                        <p className="text-xs text-[#888888555] leading-relaxed">{q.sample_answer}</p>
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

  const refreshProgress = useCallback(() => {
    if (user?.id) {
      setLoading(true);
      fetchProgress(user.id)
        .then(data => setTrackingData(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user?.id, setTrackingData]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  if (loading && !trackingData) return (
    <div className="space-y-8">
      <PageHeader title="Tracking Engine" subtitle="Loading your progress history..." />
      <DarkCard><div className="flex items-center justify-center py-12"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full" /></div></DarkCard>
    </div>
  );

  const noData = !trackingData || trackingData.total_sessions === 0;

  if (noData) return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Tracking Engine" subtitle="Your profile strength and skill growth over time." />
        <button onClick={refreshProgress} className="text-xs text-[#1B2A4A] hover:text-[#1B2A4A] flex items-center gap-2 px-3 py-2 bg-[#1B2A4A]/10 rounded-xl border border-[#1B2A4A]/20">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <EmptyState icon={BarChart2} title="No Sessions Recorded" message="Complete practice sessions or master topics in the Preparation Engine to track your score evolution here." />
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

      {/* Stats Row — reference big-number bento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: trackingData.total_sessions,                                        color: '#1B2A4A', sub: 'practice sessions' },
          { label: 'Best Score',     value: `${trackingData.best_score}%`,                                      color: '#34D399', sub: 'all-time peak' },
          { label: 'Latest Score',   value: `${trackingData.latest_session?.placement_score?.toFixed(1)||'—'}%`, color: '#818CF8', sub: 'most recent' },
          { label: 'Skills Tracked', value: trackingData.latest_session?.skills_count || 0,                     color: '#F59E0B', sub: 'on profile' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="relative rounded-2xl p-5 overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${s.color}50, transparent)` }} />
            <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>{s.label}</p>
            <p className="text-4xl font-black" style={{ color: s.color, textShadow: `0 0 20px ${s.color}40` }}>{s.value}</p>
            <p className="text-[11px] mt-1" style={{ color: '#888888' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Score Evolution Chart */}
      {evolution.length > 1 && (
        <DarkCard glow delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-black text-sm text-[#1B2A4A] uppercase tracking-widest">Score Evolution</h4>
              <p className="text-[10px] text-[#888888] mt-0.5">Each point is one practice session. Fluctuations are normal — the trend matters.</p>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: '300px' }}>
              {/* Grid lines */}
              {[25, 50, 75, 100].map(v => (
                <line key={v} x1="20" y1={chartH - 10 - (v / 100) * (chartH - 20)} x2={chartW - 20} y2={chartH - 10 - (v / 100) * (chartH - 20)} stroke="#E4DED0" strokeWidth="1" />
              ))}
              {[25, 50, 75, 100].map(v => (
                <text key={v} x="15" y={chartH - 10 - (v / 100) * (chartH - 20) + 4} fontSize="8" fill="#888888" textAnchor="end">{v}</text>
              ))}
              {/* Glow fill */}
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B2A4A" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1B2A4A" stopOpacity="0" />
                </linearGradient>
              </defs>
              {points && <polyline points={points} fill="none" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px rgba(27,42,74,0.6))" />}
              {/* Dots */}
              {evolution.map((e, i) => {
                const x = (i / Math.max(evolution.length - 1, 1)) * (chartW - 40) + 20;
                const y = chartH - 10 - ((e.score / 100) * (chartH - 20));
                return <circle key={i} cx={x} cy={y} r="4" fill="#1B2A4A" stroke="#F4EFE4" strokeWidth="2" />;
              })}
            </svg>
          </div>
          <div className="flex gap-4 mt-3 pb-4 overflow-x-auto">
            {evolution.map((e, i) => (
              <div key={i} className="text-center flex-shrink-0">
                <div className="text-sm font-black text-[#1B2A4A]">{e.score}%</div>
                <div className="text-[9px] text-[#888888] mt-0.5">{e.date}</div>
              </div>
            ))}
          </div>
        </DarkCard>
      )}

      {/* Sessions Table */}
      <DarkCard delay={0.2}>
        <h4 className="font-black text-sm text-[#1B2A4A] uppercase tracking-widest mb-5">Session History</h4>
        <div className="space-y-3">
          {sessions.slice().reverse().map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl px-4 py-3 gap-2" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/10 border border-[#1B2A4A]/20 flex items-center justify-center">
                  <Clock size={14} className="text-[#1B2A4A]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1B2A4A]">{s.target_role || 'Unknown Role'}</p>
                  <p className="text-[10px] text-[#888888]">{s.date}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                {s.aptitude_score != null && <div className="text-center"><div className="font-black text-[#1B2A4A]">{s.aptitude_score}%</div><div className="text-[#888888] text-[9px]">Aptitude</div></div>}
                {s.coding_score != null && <div className="text-center"><div className="font-black text-[#818CF8]">{s.coding_score}%</div><div className="text-[#888888] text-[9px]">Coding</div></div>}
                {s.interview_score != null && <div className="text-center"><div className="font-black text-[#34D399]">{s.interview_score}%</div><div className="text-[#888888] text-[9px]">Interview</div></div>}
                <div className="text-center"><div className="font-black text-[#1B2A4A]">{s.placement_score?.toFixed(1) || '—'}%</div><div className="text-[#888888] text-[9px]">Overall</div></div>
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
  const { user, analyzedData, setAnalyzedData, setPreparationData, setPracticeData, setTrackingData, trackingData } = useAppContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [atsResultData, setAtsResultData] = useState(null);
  const [jdResultData, setJdResultData] = useState(null);

  const handleGenerateReport = async () => {
    if (!analyzedData) return;
    setGeneratingReport(true);
    try {
      const payload = {
        ...analyzedData,
        ats_data: atsResultData,
        jd_data: jdResultData
      };
      await generateDossier(payload, user?.id);
    } catch (error) {
      console.error('❌ Report generation failed:', error);
      let errorMsg = 'Failed to generate report. ';
      if (error.response?.data?.detail) {
        errorMsg += error.response.data.detail;
      } else {
        errorMsg += error.message || 'Unknown error occurred';
      }
      alert('❌ ' + errorMsg);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAnalyzeComplete = useCallback(async (data) => {
    setAnalyzedData(data);
    setSelectedRoleIndex(0);
    // Seed engine data from the single upload_resume response
    if (data?.preparation_plan) setPreparationData(data.preparation_plan);
    if (data?.practice_set) setPracticeData(data.practice_set);

    // Automatically fetch ATS data with the correct payload so the dossier
    // shows the same JOB MODE score as StandaloneATSAnalyzer
    try {
      const payload = {
        parsed_data: {
          skills:     data.allDetected || data.skills || [],
          sections:   data.raw_profile?.sections || [],
          education:  data.raw_profile?.education || {},
          experience: data.raw_profile?.experience || {},
          projects:   data.raw_profile?.projects || [],
          contact:    data.raw_profile?.contact || {},
        },
        raw_text: data.extractedText || data.raw_text || '',
      };
      const response = await fetch('http://localhost:8000/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const intel = await response.json();
        // Store in the same structure analytics_provider expects
        setAtsResultData({
          overall_ats_score: intel.overall_ats_score,
          overall_score:     intel.overall_ats_score,
          grade:             intel.grade,
          grade_description: intel.grade_description,
          breakdown:         intel.breakdown,
          missing_skills:    intel.missing_skills || [],
          feedback:          intel.grade_description,
        });
      }
    } catch (err) {
      console.error("Auto-fetch ATS Error:", err);
    }

    // Automatically record initial tracking session
    if (user?.id && data?.prediction?.placement_probability !== undefined) {
      const sessionData = {
        user_id: user.id,
        placement_score: data.prediction.placement_probability * 100,
        skills_snapshot: data.skills || [],
        target_role: data.topRole?.role || "Initial Analysis",
        completed_topics: []
      };
      import('../services/engineApi').then(api => {
        api.recordSession(sessionData).catch(err => console.error("Auto-record failed:", err));
      });
    }
  }, [setPreparationData, setPracticeData, user]);

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
      <div className="space-y-5">
        {/* Skills bento: detected skills as bar chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #1B2A4A, transparent)' }} />
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>Detected Skills</p>
                <p className="text-4xl font-black text-[#1B2A4A]">{analyzedData?.allDetected?.length || 0}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F4EFE4', border: '1px solid #E4DED0' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: '#888888' }}>Skills extracted from your resume</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {(analyzedData?.allDetected || []).slice(0, 12).map((skill, i) => (
                <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(27,42,74,0.1)', border: '1px solid rgba(27,42,74,0.22)', color: '#1B2A4A' }}>
                  {skill}
                </motion.span>
              ))}
              {(analyzedData?.allDetected?.length || 0) > 12 && (
                <span className="text-[10px] font-medium self-center" style={{ color: '#888888' }}>+{(analyzedData?.allDetected?.length || 0) - 12} more</span>
              )}
            </div>
          </div>

          {/* Top role match card */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #34D399, transparent)' }} />
            <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#888888' }}>Role Match Scores</p>
            <p className="text-4xl font-black mb-4" style={{ color: '#34D399' }}>{analyzedData?.jobRoles?.length || 0}</p>
            <div className="space-y-3">
              {(analyzedData?.jobRoles || []).slice(0, 5).map((role, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-[#1B2A4A] w-24 sm:w-32 truncate flex-shrink">{typeof role === 'string' ? role : role.title}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E4DED0' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${role.match || 80}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: '#1B2A4A' }} />
                  </div>
                  <span className="text-xs font-black w-9 text-right" style={{ color: '#1B2A4A' }}>{role.match || 80}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    analysis: (
      <div className="space-y-5">
        {/* Role selector */}
        <div className="flex flex-wrap gap-2">
          {analyzedData?.jobRoles?.map((role, idx) => (
            <button key={idx} onClick={() => setSelectedRoleIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                selectedRoleIndex === idx 
                  ? 'bg-[#1B2A4A] border-[#1B2A4A] text-white shadow-[0_0_15px_rgba(27,42,74,0.3)]' 
                  : 'text-[#888888] hover:text-[#888888555]'
              }`}
              style={selectedRoleIndex !== idx ? { background: '#FFFFFF', borderColor: '#E4DED0' } : {}}>
              {role.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Present skills with bar */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #34D399, transparent)' }} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                <h5 className="font-black text-sm text-[#1B2A4A]">Skills You Have</h5>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399' }}>
                {analyzedData?.jobRoles?.[selectedRoleIndex]?.present?.length || 0}
              </span>
            </div>
            <div className="space-y-2">
              {(analyzedData?.jobRoles?.[selectedRoleIndex]?.present || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.03)', border: '1px solid rgba(52,211,153,0.06)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#86efac' }}>{s}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>✓ Present</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing skills with bar */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #F87171, transparent)' }} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F87171', boxShadow: '0 0 6px rgba(248,113,113,0.8)' }} />
                <h5 className="font-black text-sm text-[#1B2A4A]">Critical Gaps</h5>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171' }}>
                {analyzedData?.jobRoles?.[selectedRoleIndex]?.missing?.length || 0}
              </span>
            </div>
            <div className="space-y-2">
              {(analyzedData?.jobRoles?.[selectedRoleIndex]?.missing || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(248,113,113,0.03)', border: '1px solid rgba(248,113,113,0.06)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#fca5a5' }}>{s}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>Missing</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    recommendations: <RecommendationsView data={analyzedData} />,
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
              <p className="text-sm text-[#888888555] leading-relaxed">
                Our intelligence layer cross-references your resume against{' '}
                <span className="text-[#1B2A4A] font-bold">50,000+ placement records</span> to generate accurate career trajectories and skill gap analysis.
              </p>
            </div>
          </DarkCard>

          {/* Feature preview chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Target size={20} />, title: 'Skill Gap Analysis', desc: 'Instantly identify missing skills', color: '#1B2A4A' },
              { icon: <TrendingUp size={20} />, title: 'Profile Strength Index', desc: 'Know your readiness percentile', color: '#818CF8' },
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
                  <h4 className="text-xs font-black text-[#1B2A4A]">{tip.title}</h4>
                  <p className="text-[11px] text-[#888888]">{tip.desc}</p>
                </motion.div>
              </DarkCard>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <InsightCards data={analyzedData} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-between relative z-40"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[#1B2A4A] shadow-[0_0_10px_rgba(27,42,74,0.6)]" />
              <p className="text-xs font-black uppercase tracking-widest text-[#888888]">Analysis Complete</p>
            </div>
          </motion.div>
          
          {/* AI Insights Card */}
          {analyzedData?.llm_enhancement && analyzedData.llm_enhancement.summary && (
            <DarkCard delay={0.2} glow>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-purple-400">✨</span>
                <h4 className="font-black text-sm text-[#1B2A4A] uppercase tracking-widest">AI Intelligence Summary</h4>
              </div>
              <p className="text-[#888888555] text-sm leading-relaxed mb-4">{analyzedData.llm_enhancement.summary}</p>
              {analyzedData.llm_insights?.career_advice && (
                 <div className="bg-[#FFFFFF] border border-[#222] p-4 rounded-xl">
                   <h5 className="text-xs font-bold text-[#1B2A4A] mb-2">Career Advisory Pipeline</h5>
                   <p className="text-[#666] text-xs leading-relaxed">{analyzedData.llm_insights.career_advice}</p>
                 </div>
              )}
            </DarkCard>
          )}

          {/* Main Overview Content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {overviewTabContent['overview']}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex w-full flex-1 overflow-hidden bg-dashboard-base">
      <Sidebar />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0 overflow-y-auto relative overflow-x-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(27,42,74,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(27,42,74,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        {/* Mobile menu button */}
        <div className="flex items-center justify-between mb-6 md:hidden relative z-10">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center gap-2 glass-panel px-3 py-2 rounded-xl text-[#888888555] hover:text-[#1B2A4A] transition-colors shadow-card-depth"
          >
            <Menu size={18} />
            <span className="text-sm font-semibold">Menu</span>
          </button>
          <div className="text-sm font-black text-[#888888555]">
            {greeting}, <span className="text-[#1B2A4A]">{analyzedData?.studentName || user?.name || 'User'}</span>
          </div>
        </div>

        {/* Desktop Header — High Fidelity Reference Match */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 hidden md:flex flex-wrap items-center justify-between gap-6 relative z-50"
        >
          {/* Greeting Title */}
          <div className="flex-1">
            <h1 className="text-4xl font-black text-[#1B2A4A] tracking-tighter mb-1">
              {greeting === 'Good morning' ? 'Website Analytics' : greeting === 'Good afternoon' ? 'Platform Insights' : 'System Overview'}
            </h1>
            <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest">Dashboard Overview</p>
          </div>

          {/* Right Profile - Simplified */}
          <div className="flex flex-wrap items-center gap-6">
            {analyzedData && (
              <div className="flex flex-wrap items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={generatingReport}
                  onClick={handleGenerateReport}
                  className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-[#1B2A4A] text-white font-black text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_4px_14px_0_rgba(27,42,74,0.39)] cursor-pointer group"
                >
                  {generatingReport ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} className="group-hover:translate-y-[-1px] transition-transform" />
                  )}
                  <span className="font-black uppercase tracking-widest text-[11px]">
                    {generatingReport ? 'Generating...' : 'Generate Report'}
                  </span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B2A4A]/10 border border-[#1B2A4A]/30 text-[#1B2A4A] hover:bg-[#1B2A4A]/20 transition-all group shadow-[0_0_20px_rgba(27,42,74,0.1)] cursor-pointer"
                >
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Analysis</span>
                </motion.button>
              </div>
            )}
            <div className="flex items-center gap-4 border-l border-[#1B2A4A]/5 pl-6">
              <div className="text-right">
                <p className="text-sm font-black text-[#1B2A4A] leading-tight">{analyzedData?.studentName || user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-[#888888]">{user?.email || 'student@email.com'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1B2A4A]/10 border border-[#1B2A4A]/20 flex items-center justify-center text-[#1B2A4A] font-black text-xs shadow-neon-glow">
                {(analyzedData?.studentName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile: score banner */}
        {analyzedData && (
          <div className="md:hidden flex flex-col sm:flex-row sm:items-center justify-between mb-4 glass-panel p-4 rounded-2xl border border-primary-accent/20 shadow-card-depth gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="text-sm font-black flex items-center gap-2 text-[#888888555]">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                Score: <span className="text-primary-accent">{analyzedData.score}%</span>
              </div>
              <button onClick={handleReset} className="text-xs text-[#888888] hover:text-red-400 flex items-center gap-1 cursor-pointer">
                <RefreshCw size={12} /> Reset
              </button>
            </div>
            <button
              disabled={generatingReport}
              onClick={handleGenerateReport}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-[#1B2A4A] text-white font-black text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_4px_14px_0_rgba(27,42,74,0.39)] cursor-pointer group uppercase tracking-widest text-[11px]"
            >
              {generatingReport ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <FileText size={12} />
              )}
              {generatingReport ? 'Generating Report...' : 'Generate Report'}
            </button>
          </div>
        )}

        {/* Routes - Modular Hub Entry */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<ModulesHub />} />
            
            {/* Module 1: Profile Intelligence */}
            <Route path="profile" element={<OverviewPage />} />
            <Route path="analysis" element={<AnalysisPage data={analyzedData} setAtsResultData={setAtsResultData} setJdResultData={setJdResultData} />} />
            <Route path="ats-checker" element={<AtsCheckerPage data={analyzedData} setAtsResultData={setAtsResultData} setJdResultData={setJdResultData} />} />
            <Route path="skills" element={<SkillsPage data={analyzedData} selectedRoleIndex={selectedRoleIndex} setSelectedRoleIndex={setSelectedRoleIndex} />} />
            <Route path="score" element={<ScorePage data={analyzedData} />} />
            <Route path="recommendations" element={<RecommendationsPage data={analyzedData} />} />
            
            {/* Module 2: Preparation Engine */}
            <Route path="preparation" element={<PreparationModule />} />
            
            {/* Module 3: Practice Engine */}
            <Route path="practice" element={<PracticeModule />} />

            {/* Module 4: Tracking Engine */}
            <Route path="tracking" element={<TrackingModule />} />

            {/* Module 5: Placement Engine */}
            <Route path="placement" element={<PlacementEngine />} />

            {/* Profile Management */}
            <Route path="my-profile" element={<MyProfile />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
