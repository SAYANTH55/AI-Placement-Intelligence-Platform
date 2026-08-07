import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, Zap, Target, BarChart3 } from 'lucide-react';

function ScoreDonut({ value, label, color, size = 80 }) {
  const R = (size - 10) / 2;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(value / 100, 1));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={R} fill="none"
            stroke="rgba(27,42,74,0.10)" strokeWidth={8} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={R} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
              filter: `drop-shadow(0 0 5px ${color}60)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider text-[#1B2A4A]/40 text-center">{label}</span>
    </div>
  );
}

export default function ATSChecker({ data, onCheckComplete }) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Try the new Engine 4 endpoint first
      const payload = {
        resume_skills: data?.skills || data?.allDetected || [],
        resume_text: data?.raw_text || '',
        jd_text: jd,
      };

      let res = await fetch('http://127.0.0.1:8001/api/ats/match-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to legacy endpoint
        res = await fetch('http://127.0.0.1:8001/api/compare-jd?user_id=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_description: jd, extracted_skills: data?.skills || [] }),
        });
      }

      if (!res.ok) throw new Error('Failed to analyze job description.');
      const resData = await res.json();

      // Normalise legacy vs. new response
      const normalised = resData.semantic_match !== undefined ? resData : {
        semantic_match: resData.role_match?.match_percent || 0,
        keyword_match: resData.role_match?.match_percent || 0,
        final_ats: resData.role_match?.match_percent || 0,
        matched_skills: resData.gap_analysis?.present_skills || [],
        missing_skills: resData.gap_analysis?.missing_skills || [],
        inferred_jd_role: resData.role_match?.inferred_roles?.[0]?.name || 'Unknown',
        recommendations: [],
        total_jd_skills: 0,
        resume_skill_coverage: 0,
      };

      setResult(normalised);
      if (onCheckComplete) onCheckComplete(normalised);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-[#818CF8]" style={{ boxShadow: '0 0 10px rgba(129,140,248,0.5)' }} />
        <h2 className="text-base font-black text-[#1B2A4A] tracking-tight">Engine 4 — Enterprise JD Matcher</h2>
        <span className="ml-auto text-[9px] px-2 py-1 rounded-full font-black"
          style={{ background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.25)', color: '#818CF8' }}>
          Semantic + Keyword
        </span>
      </div>

      {/* JD Input */}
      <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
        <p className="text-[11px] text-[#6B6B63] mb-3">
          Paste a job description to compute semantic & keyword JOB MODE compatibility against your resume.
        </p>
        <textarea
          className="w-full rounded-xl p-4 text-sm text-[#1B2A4A] outline-none resize-none transition-all"
          style={{
            background: '#F4EFE4',
            border: '1px solid #C9C2AF',
            minHeight: '120px',
          }}
          onFocus={e => e.target.style.borderColor = '#1B2A4A'}
          onBlur={e => e.target.style.borderColor = '#C9C2AF'}
          placeholder="Paste the full job description here..."
          value={jd}
          onChange={e => setJd(e.target.value)}
          rows={5}
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-[#6B6B63]">{jd.trim().split(/\s+/).filter(Boolean).length} words</span>
          <button
            onClick={handleAnalyze}
            disabled={loading || !jd.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #1B2A4A, #0C447C)',
              boxShadow: '0 4px 14px rgba(27,42,74,0.25)',
            }}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Match JD'}
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl text-xs text-red-400"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Score trio */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: '#FFFFFF', border: '1px solid rgba(129,140,248,0.20)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, #818CF8, transparent)' }} />

              <div className="flex items-center justify-around gap-4">
                <ScoreDonut value={result.semantic_match} label="Semantic Match" color="#818CF8" />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-3xl font-black"
                    style={{ color: result.final_ats >= 70 ? '#10B981' : result.final_ats >= 45 ? '#F59E0B' : '#EF4444' }}>
                    {Math.round(result.final_ats)}%
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-[#1B2A4A]/30 font-black">JOB MODE Score</div>
                  {result.inferred_jd_role && (
                    <div className="mt-1 px-2 py-1 rounded-full text-[9px] font-black"
                      style={{ background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.25)', color: '#818CF8' }}>
                      <Target className="w-2.5 h-2.5 inline mr-1" />
                      {result.inferred_jd_role}
                    </div>
                  )}
                </div>
                <ScoreDonut value={result.keyword_match} label="Keyword Match" color="#10B981" />
              </div>

              {/* Coverage stat */}
              {result.total_jd_skills > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <BarChart3 className="w-3 h-3 text-[#1B2A4A]/30" />
                  <span className="text-[10px] text-[#1B2A4A]/30">
                    {result.matched_skills?.length || 0} of {result.total_jd_skills} JD skills matched
                    ({result.resume_skill_coverage || 0}% coverage)
                  </span>
                </div>
              )}
            </div>

            {/* Matched / Missing skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matched */}
              <div className="rounded-2xl p-4 relative" style={{ background: '#FFFFFF', border: '1px solid rgba(16,185,129,0.20)' }}>
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{ background: 'linear-gradient(to right, transparent, #10B981, transparent)' }} />
                <p className="text-[10px] font-black uppercase tracking-wider text-green-500/80 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> Matched Requirements
                </p>
                {result.matched_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills.map((s, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#1B2A4A]/30 italic">No matched skills detected.</p>
                )}
              </div>

              {/* Missing */}
              <div className="rounded-2xl p-4 relative" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.20)' }}>
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{ background: 'linear-gradient(to right, transparent, #EF4444, transparent)' }} />
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400/80 mb-3 flex items-center gap-1.5">
                  <XCircle className="w-3 h-3" /> Missing Requirements
                </p>
                {result.missing_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.map((s, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#EF4444' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-400 font-bold italic">No significant gaps — great match!</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E4DED0' }}>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#1B2A4A] mb-3 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Recommendations
                </p>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[9px] font-black w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(27,42,74,0.10)', color: '#1B2A4A' }}>
                        {i + 1}
                      </span>
                      <p className="text-[11px] text-[#6B6B63] leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
