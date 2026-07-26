import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';

const GRADE_CONFIG = {
  Excellent: {
    color: '#10B981',
    glow: 'rgba(16,185,129,0.3)',
    ring: '#10B981',
    Icon: Award,
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
  },
  Good: {
    color: '#1B2A4A',
    glow: 'rgba(27,42,74,0.3)',
    ring: '#1B2A4A',
    Icon: TrendingUp,
    bg: 'rgba(27,42,74,0.08)',
    border: 'rgba(27,42,74,0.25)',
  },
  Fair: {
    color: '#EAB308',
    glow: 'rgba(234,179,8,0.3)',
    ring: '#EAB308',
    Icon: AlertTriangle,
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.25)',
  },
  Poor: {
    color: '#EF4444',
    glow: 'rgba(239,68,68,0.3)',
    ring: '#EF4444',
    Icon: XCircle,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
};

export default function ATSScoreCard({ score = 0, grade = 'Fair', description = '', totalSkills = 0, topRole = '' }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['Fair'];
  const { color, glow, ring, Icon, bg, border } = cfg;

  // SVG radial gauge
  const SIZE = 180;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const pct = Math.min(score / 100, 1);
  const dashOffset = C * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-6 p-6 rounded-2xl relative"
      style={{ background: '#FFFFFF', border: `1px solid ${border}` }}>
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }} />

      {/* Engine label */}
      <div className="flex items-center gap-2 self-start">
        <div className="w-1 h-4 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${glow}` }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2A4A]/40">
          Engine 1 — Standalone JOB MODE Benchmark
        </span>
      </div>

      {/* Radial gauge */}
      <div className="relative flex items-center justify-center">
        <svg width={SIZE} height={SIZE}>
          {/* Background track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="rgba(27,42,74,0.1)"
            strokeWidth={STROKE}
          />
          {/* Animated score arc */}
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={ring}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
              filter: `drop-shadow(0 0 6px ${glow})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-black leading-none"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: bg, border: `1px solid ${border}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-sm font-black" style={{ color }}>{grade}</span>
        </div>
        {description && (
          <p className="text-[11px] text-[#1B2A4A]/40 text-center leading-relaxed max-w-[220px]">
            {description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="w-full grid grid-cols-2 gap-3 mt-2">
        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xl font-black text-[#1B2A4A]">{totalSkills}</div>
          <div className="text-[9px] uppercase tracking-wider text-[#1B2A4A]/30 mt-0.5">Skills Detected</div>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[11px] font-black text-[#1B2A4A] truncate">{topRole || 'Unknown'}</div>
          <div className="text-[9px] uppercase tracking-wider text-[#1B2A4A]/30 mt-0.5">Top Role Match</div>
        </div>
      </div>
    </div>
  );
}
