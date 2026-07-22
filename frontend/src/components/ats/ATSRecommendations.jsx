import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Wrench, TrendingUp, Info } from 'lucide-react';

const PRIORITY_CONFIG = {
  HIGH: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.20)', label: 'HIGH' },
  MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)', label: 'MED' },
  LOW: { color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.20)', label: 'LOW' },
};

function FixCard({ fix, index }) {
  const [expanded, setExpanded] = useState(index < 2);
  const prio = PRIORITY_CONFIG[fix.priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${prio.border}` }}
    >
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#1B2A4A]/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Priority badge */}
        <div className="flex-shrink-0 px-2 py-1 rounded-lg text-[9px] font-black"
          style={{ background: prio.bg, border: `1px solid ${prio.border}`, color: prio.color }}>
          {prio.label}
        </div>

        {/* Title + improvement */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-[#1B2A4A]/90 block truncate">{fix.title}</span>
          <span className="text-[9px] text-[#1B2A4A]/30">{fix.category}</span>
        </div>

        {/* ATS improvement badge */}
        {fix.estimated_improvement && (
          <span className="flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
            <TrendingUp className="w-2.5 h-2.5 inline mr-1" />
            {fix.estimated_improvement}
          </span>
        )}

        <div className="text-[#1B2A4A]/20 flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Evidence */}
              {fix.evidence && (
                <div className="pt-3 flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: prio.color }} />
                  <p className="text-[10px] text-[#1B2A4A]/50 leading-relaxed">
                    <span className="font-black text-[#1B2A4A]/40 uppercase tracking-wider">Evidence: </span>
                    {fix.evidence}
                  </p>
                </div>
              )}

              {/* Why it matters */}
              {fix.why_it_matters && (
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#818CF8]" />
                  <p className="text-[10px] text-[#1B2A4A]/50 leading-relaxed">
                    <span className="font-black text-[#818CF8] uppercase tracking-wider text-[9px]">Why It Matters: </span>
                    {fix.why_it_matters}
                  </p>
                </div>
              )}

              {/* Recommended fix */}
              {fix.recommended_fix && (
                <div className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <Wrench className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                  <p className="text-[10px] text-green-400/80 leading-relaxed">
                    <span className="font-black text-green-500 uppercase tracking-wider text-[9px]">Fix: </span>
                    {fix.recommended_fix}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ATSRecommendations({ fixes = [] }) {
  if (!fixes.length) {
    return (
      <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-[#10B981]" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2A4A]/40">
            Engine 3 — Actionable Fixes
          </span>
        </div>
        <p className="text-xs text-green-400 font-bold pl-3">
          No significant issues detected — excellent work!
        </p>
      </div>
    );
  }

  const high = fixes.filter(f => f.priority === 'HIGH');
  const others = fixes.filter(f => f.priority !== 'HIGH');

  return (
    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-[#EF4444]" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.4)' }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2A4A]/40">
          Engine 3 — Actionable Fixes
        </span>
        <div className="ml-auto flex gap-2">
          {high.length > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
              {high.length} HIGH
            </span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888888555' }}>
            {fixes.length} total
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {fixes.map((fix, i) => (
          <FixCard key={i} fix={fix} index={i} />
        ))}
      </div>
    </div>
  );
}
