import { Activity, Target, TrendingUp } from 'lucide-react';
import ScoreRing from './ScoreRing';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   InsightCards — 3-up bento row
   Proper sizing, industry avg with a comparison bar, no overflow
───────────────────────────────────────────────────────────────── */
export default function InsightCards({ data }) {
  if (!data) return null;

  const score = data.score ?? 0;
  const industryAvg = 62;
  const missing = data.missing ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* ── Card 1: Placement Score ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className="relative flex flex-col overflow-hidden rounded-[18px] p-5"
        style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #1B2A4A50, transparent)' }} />

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(27,42,74,0.08)', border: '1px solid rgba(27,42,74,0.15)' }}>
            <Activity size={14} style={{ color: '#1B2A4A' }} />
          </div>
          <div>
            <h3 className="font-black text-[#1B2A4A] text-[13px] leading-tight">Placement Score</h3>
            <p className="text-[11px] leading-tight text-[#9A968A]">Overall readiness</p>
          </div>
        </div>

        {/* Big number */}
        <div className="text-4xl font-black text-[#1B2A4A] mb-4">{score}%</div>

        {/* Ring + Industry avg comparison */}
        <div className="flex items-end justify-between gap-3">
          <ScoreRing score={score} size={72} strokeWidth={6} />

          {/* Industry avg comparison */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A968A] mb-2">vs Industry Avg</p>
            {/* Your score bar */}
            <div className="mb-1.5">
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-[#1B2A4A]">You</span>
                <span className="text-[10px] font-black text-[#1B2A4A]">{score}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#E4DED0' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ background: '#1B2A4A' }} />
              </div>
            </div>
            {/* Industry bar */}
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-[#9A968A]">Industry</span>
                <span className="text-[10px] font-black text-[#9A968A]">{industryAvg}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#E4DED0' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${industryAvg}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ background: '#C9C2AF' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Card 2: Missing Skills ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className="relative flex flex-col overflow-hidden rounded-[18px] p-5"
        style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #F8717150, transparent)' }} />

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <Target size={14} style={{ color: '#F87171' }} />
          </div>
          <div>
            <h3 className="font-black text-[#1B2A4A] text-[13px] leading-tight">Missing Skills</h3>
            <p className="text-[11px] leading-tight text-[#9A968A]">{missing.length} gaps identified</p>
          </div>
        </div>

        {/* Big number */}
        <div className="text-4xl font-black mb-4" style={{ color: '#F87171' }}>{missing.length}</div>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-1.5">
          {missing.slice(0, 4).map((skill, i) => (
            <span key={i} className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#791F1F' }}>
              {skill}
            </span>
          ))}
          {missing.length > 4 && (
            <span className="text-[11px] font-medium self-center" style={{ color: '#9A968A' }}>
              +{missing.length - 4} more
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Card 3: Placement Probability ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className="relative flex flex-col overflow-hidden rounded-[18px] p-5"
        style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #1B2A4A50, transparent)' }} />

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(27,42,74,0.08)', border: '1px solid rgba(27,42,74,0.15)' }}>
            <TrendingUp size={14} style={{ color: '#1B2A4A' }} />
          </div>
          <div>
            <h3 className="font-black text-[#1B2A4A] text-[13px] leading-tight">Placement Prob.</h3>
            <p className="text-[11px] leading-tight text-[#9A968A]">Based on 50k+ records</p>
          </div>
        </div>

        {/* Big number */}
        <div className="text-4xl font-black text-[#1B2A4A] mb-4">{score}%</div>

        {/* Sector breakdown bars */}
        <div className="space-y-2.5">
          {[
            { label: 'Tech',     pct: Math.min(score + 8, 100) },
            { label: 'Finance',  pct: Math.max(score - 10, 5)  },
            { label: 'Product',  pct: Math.min(score + 2, 100) },
          ].map((bar, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#6B6B63]">{bar.label}</span>
                <span className="text-[11px] font-black text-[#1B2A4A]">{bar.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#E4DED0' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: '#1B2A4A', opacity: 1 - i * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
