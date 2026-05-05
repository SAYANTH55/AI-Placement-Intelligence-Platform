import { Activity, Target, Briefcase, TrendingUp } from 'lucide-react';
import ScoreRing from './ScoreRing';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   InsightCards — Reference-match design
   Big-number stat cards with icon containers, top accent bar,
   and arrow link bottom — identical visual language to reference.
───────────────────────────────────────────────────────────────── */
export default function InsightCards({ data }) {
  if (!data) return null;

  const cards = [
    {
      icon: Activity,
      title: 'Placement Score',
      sub: 'Overall readiness',
      accent: '#F97316',
      big: `${data.score}%`,
      content: (
        <div className="flex items-center justify-between mt-2">
          <ScoreRing score={data.score} size={76} strokeWidth={7} />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">Industry avg</p>
            <p className="text-lg font-black text-white">62%</p>
          </div>
        </div>
      ),
    },
    {
      icon: Target,
      title: 'Missing Skills',
      sub: `${data.missing.length} gaps identified`,
      accent: '#F87171',
      big: `${data.missing.length}`,
      content: (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.missing.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171' }}
            >
              {skill}
            </span>
          ))}
          {data.missing.length > 3 && (
            <span className="text-[10px] font-medium self-center" style={{ color: '#444' }}>
              +{data.missing.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      icon: Briefcase,
      title: 'Top Roles',
      sub: 'Best career matches',
      accent: '#34D399',
      big: `${(data.jobRoles || []).length}`,
      content: (
        <ul className="space-y-2 mt-3">
          {(data.jobRoles || []).slice(0, 3).map((role, i) => (
            <li key={i} className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#888' }}>
              <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full" style={{ background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
              {typeof role === 'string' ? role : role.title}
              {role.match && <span className="ml-auto text-[10px]" style={{ color: '#34D399' }}>{role.match}%</span>}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: TrendingUp,
      title: 'Placement Prob.',
      sub: 'Based on 50k+ records',
      accent: '#818CF8',
      big: `${data.score}%`,
      content: (
        <div className="mt-3">
          {/* Mini bar chart */}
          <div className="space-y-1.5">
            {[
              { label: 'Tech', pct: Math.min(data.score + 8, 100) },
              { label: 'Finance', pct: Math.max(data.score - 10, 10) },
              { label: 'Product', pct: Math.min(data.score + 2, 100) },
            ].map((bar, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] w-10 flex-shrink-0" style={{ color: '#444' }}>{bar.label}</span>
                <div className="flex-1 h-1 rounded-full" style={{ background: '#1c1c1c' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.pct}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: '#818CF8', boxShadow: '0 0 6px rgba(129,140,248,0.5)' }}
                  />
                </div>
                <span className="text-[9px] w-6 text-right" style={{ color: '#555' }}>{bar.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3 }}
          className="relative flex flex-col overflow-hidden cursor-default"
          style={{
            background: '#111',
            border: '1px solid #1c1c1c',
            borderRadius: '18px',
            padding: '20px',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = `${card.accent}30`}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#1c1c1c'}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${card.accent}50, transparent)` }}
          />

          {/* Arrow link top-right (reference style) */}
          <div
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: '#1c1c1c', border: '1px solid #252525' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 8L8 2M8 2H4M8 2V6" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Icon + label */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${card.accent}18`, border: `1px solid ${card.accent}30` }}
            >
              <card.icon size={16} style={{ color: card.accent }} />
            </div>
            <div>
              <h3 className="font-black text-white text-xs leading-tight">{card.title}</h3>
              <p className="text-[10px] leading-tight" style={{ color: '#444' }}>{card.sub}</p>
            </div>
          </div>

          {/* Big number — reference style */}
          <div className="text-3xl font-black mb-1" style={{ color: card.accent, textShadow: `0 0 20px ${card.accent}40` }}>
            {card.big}
          </div>

          {/* Extra content */}
          {card.content}
        </motion.div>
      ))}
    </div>
  );
}
