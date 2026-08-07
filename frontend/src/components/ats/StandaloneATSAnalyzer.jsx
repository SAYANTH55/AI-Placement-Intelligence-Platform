import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';

import ATSScoreCard from './ATSScoreCard';
import ATSBreakdown from './ATSBreakdown';
import RolePredictionCard from './RolePredictionCard';
import ATSRecommendations from './ATSRecommendations';
import ATSChecker from '../dashboard/ATSChecker';

/**
 * StandaloneATSAnalyzer
 * ---------------------
 * The master Resume Intelligence System component.
 * Calls /api/ats/analyze with the parsed resume data, then renders
 * all 4 engine outputs from the unified ResumeIntelligenceResponse.
 *
 * Accepts either:
 *   data = the parsed resume object (containing skills, sections, etc.)
 *       OR
 *   intelligenceData = pre-fetched ResumeIntelligenceResponse (skip API call)
 */
export default function StandaloneATSAnalyzer({ data, intelligenceData: preloaded, onIntelReady }) {
  const [intel, setIntel] = useState(preloaded || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const runAnalysis = async (resumeData) => {
    if (!resumeData) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        parsed_data: {
          skills:     resumeData.allDetected || resumeData.skills || [],
          sections:   resumeData.raw_profile?.sections || resumeData.sections || [],
          education:  resumeData.raw_profile?.education || resumeData.education || {},
          experience: resumeData.raw_profile?.experience || resumeData.experience || {},
          projects:   resumeData.raw_profile?.projects || resumeData.projects || [],
          contact:    resumeData.raw_profile?.contact || resumeData.contact || {},
        },
        raw_text: resumeData.extractedText || resumeData.raw_text || resumeData.text || '',
      };

      const res = await fetch('http://127.0.0.1:8001/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
      const result = await res.json();
      setIntel(result);
      // Notify parent so atsResultData stays in sync with what's shown on screen
      if (onIntelReady) onIntelReady(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when data changes
  useEffect(() => {
    if (data && !preloaded) {
      runAnalysis(data);
    }
  }, [data?.skills?.join?.(',')]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-[#1B2A4A]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-t-[#1B2A4A] rounded-full animate-spin" />
          <Brain className="absolute inset-0 m-auto w-6 h-6 text-[#1B2A4A]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-[#1B2A4A]/70">Running Resume Intelligence Analysis</p>
          <p className="text-xs text-[#1B2A4A]/30 mt-1">4 engines processing in sequence...</p>
        </div>
        <div className="flex gap-2 mt-2">
          {['JOB MODE Benchmark', 'Role Alignment', 'Actionable Fixes', 'Preparing...'].map((label, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888888' }}
              animate={{ borderColor: ['rgba(255,255,255,0.08)', 'rgba(27,42,74,0.4)', 'rgba(255,255,255,0.08)'] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 rounded-2xl flex items-start gap-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-red-400">Analysis Failed</p>
          <p className="text-xs text-red-400/60 mt-1 leading-relaxed">{error}</p>
          <button
            onClick={() => runAnalysis(data)}
            className="mt-3 flex items-center gap-1.5 text-xs text-red-400 font-bold hover:text-red-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── No data ────────────────────────────────────────────────────────────
  if (!intel) return null;

  // ── TABS ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'JOB MODE Score' },
    { id: 'roles', label: 'Role Alignment' },
    { id: 'fixes', label: `Fixes (${intel.total_fixes || 0})` },
    { id: 'jd', label: 'JD Matcher' },
  ];

  return (
    <div className="space-y-6">
      {/* Engine label */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 rounded-full bg-[#1B2A4A]" style={{ boxShadow: '0 0 12px rgba(27,42,74,0.5)' }} />
        <div>
          <h2 className="text-lg font-black text-[#1B2A4A] tracking-tight">Resume Intelligence System</h2>
          <p className="text-[10px] text-[#1B2A4A]/30">4 deterministic AI engines • No LLM guessing</p>
        </div>
        <button
          onClick={() => runAnalysis(data)}
          className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-[#1B2A4A]/30 hover:text-[#1B2A4A]/60 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Re-analyze
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-bold transition-all border ${
                isSelected
                  ? 'bg-[#1B2A4A] text-white border-transparent'
                  : 'bg-white text-[#1B2A4A] border-[#C9C2AF] hover:bg-[#F4EFE4]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ATSScoreCard
                score={intel.overall_ats_score}
                grade={intel.grade}
                description={intel.grade_description}
                totalSkills={intel.total_skills_detected}
                topRole={intel.top_role}
              />
              <ATSBreakdown breakdown={intel.breakdown} />
            </div>
          )}

          {activeTab === 'roles' && (
            <RolePredictionCard predictedRoles={intel.predicted_roles || []} />
          )}

          {activeTab === 'fixes' && (
            <ATSRecommendations fixes={intel.actionable_fixes || []} />
          )}

          {activeTab === 'jd' && (
            <ATSChecker data={data} onCheckComplete={null} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
