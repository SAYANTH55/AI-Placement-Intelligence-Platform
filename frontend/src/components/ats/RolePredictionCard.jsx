import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, ChevronDown, ChevronUp, Zap, AlertTriangle } from 'lucide-react';

const ROLE_COLORS = ['#1B2A4A', '#818CF8', '#10B981', '#06B6D4', '#F59E0B'];

function ConfidenceBar({ confidence, color, delay = 0 }) {
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(to right, ${color}60, ${color})` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(confidence, 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay }}
      />
    </div>
  );
}

function RoleCard({ role, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const color = ROLE_COLORS[index % ROLE_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${index === 0 ? color + '30' : 'rgba(255,255,255,0.05)'}` }}
    >
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#1B2A4A]/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Rank badge */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          {index + 1}
        </div>

        {/* Role + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-xs font-black ${index === 0 ? 'text-[#1B2A4A]' : 'text-[#1B2A4A]/70'}`}>
              {role.title}
            </span>
            <span className="text-[10px] font-black ml-2 flex-shrink-0" style={{ color }}>
              {role.confidence}%
            </span>
          </div>
          <ConfidenceBar confidence={role.confidence} color={color} delay={index * 0.08 + 0.1} />
        </div>

        {/* Expand icon */}
        <div className="text-[#1B2A4A]/20 flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Evidence */}
          {role.evidence && (
            <div className="pt-3 flex items-start gap-2">
              <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color }} />
              <p className="text-[10px] text-[#1B2A4A]/50 leading-relaxed">{role.evidence}</p>
            </div>
          )}

          {/* Reason */}
          {role.reason && (
            <p className="text-[11px] text-[#1B2A4A]/70 leading-relaxed pl-5">{role.reason}</p>
          )}

          {/* Matched skills */}
          {role.matched_skills?.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-green-500/70 mb-1.5 font-black pl-5">
                Matched Skills
              </p>
              <div className="flex flex-wrap gap-1 pl-5">
                {role.matched_skills.map((s, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {role.missing_skills?.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-red-400/70 mb-1.5 font-black pl-5">
                Missing Skills
              </p>
              <div className="flex flex-wrap gap-1 pl-5">
                {role.missing_skills.map((s, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#EF4444' }}>
                    <AlertTriangle className="w-2.5 h-2.5" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function RolePredictionCard({ predictedRoles = [] }) {
  if (!predictedRoles.length) {
    return (
      <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-[#1B2A4A]/30 italic">No role predictions available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-[#1B2A4A]" style={{ boxShadow: '0 0 8px rgba(27,42,74,0.4)' }} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2A4A]/40">
          Engine 2 — Target Role Alignment
        </span>
        <span className="ml-auto text-[9px] text-[#1B2A4A]/20">{predictedRoles.length} roles</span>
      </div>

      <div className="space-y-2">
        {predictedRoles.map((role, i) => (
          <RoleCard key={i} role={role} index={i} />
        ))}
      </div>
    </div>
  );
}
