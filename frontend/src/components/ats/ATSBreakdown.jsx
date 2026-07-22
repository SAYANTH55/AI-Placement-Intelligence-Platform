import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

const DIMENSION_COLORS = {
  structure: '#1B2A4A',
  skill_density: '#1B2A4A',
  experience_depth: '#1B2A4A',
  project_quality: '#1B2A4A',
  keyword_optimization: '#1B2A4A',
  education_quality: '#1B2A4A',
  achievements: '#1B2A4A',
  formatting: '#1B2A4A',
};

const DIMENSION_LABELS = {
  structure: 'Structure & Parseability',
  skill_density: 'Skill Density',
  experience_depth: 'Experience Depth',
  project_quality: 'Project Quality',
  keyword_optimization: 'Keyword Optimization',
  education_quality: 'Education Quality',
  achievements: 'Measurable Achievements',
  formatting: 'Formatting & Readability',
};

function DimensionRow({ dimKey, dim }) {
  const [expanded, setExpanded] = useState(false);
  const color = DIMENSION_COLORS[dimKey] || '#888888555';
  const pct = Math.round((dim.score / dim.max_score) * 100);
  const hasDetail = dim.issues?.length > 0 || dim.strengths?.length > 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E4DED0' }}>
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#1B2A4A]/[0.02] transition-colors"
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        {/* Score badge */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
          {dim.score}
        </div>

        {/* Label + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-[#1B2A4A]/80">{DIMENSION_LABELS[dimKey] || dim.name}</span>
            <span className="text-[10px] font-black" style={{ color }}>
              {dim.score}/{dim.max_score}
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#E4DED0' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: pct > 0 ? `max(4px, ${pct}%)` : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>

        {/* Label badge */}
        <span className="text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}25`,
          }}>
          {dim.label}
        </span>

        {hasDetail && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5 text-[#1B2A4A]/20 flex-shrink-0" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {expanded && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="pt-2 space-y-1">
                {dim.strengths?.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-[#27500A]">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#97C459]" />
                    <span>{s}</span>
                  </div>
                ))}
                {dim.issues?.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-[#791F1F]">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-500" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ATSBreakdown({ breakdown }) {
  if (!breakdown) return null;

  const dims = [
    'structure', 'skill_density', 'experience_depth', 'project_quality',
    'keyword_optimization', 'education_quality', 'achievements', 'formatting'
  ];

  return (
    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-[#818CF8]" style={{ boxShadow: '0 0 8px rgba(129,140,248,0.4)' }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2A4A]/40">
          ATS Score Breakdown — 8 Dimensions
        </span>
      </div>

      <div className="space-y-2">
        {dims.map(key => {
          const dim = breakdown[key];
          if (!dim) return null;
          return <DimensionRow key={key} dimKey={key} dim={dim} />;
        })}
      </div>
    </div>
  );
}
