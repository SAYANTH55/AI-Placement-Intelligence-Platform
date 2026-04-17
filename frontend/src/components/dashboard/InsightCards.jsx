import { Activity, Target, Briefcase, TrendingUp } from 'lucide-react';
import ScoreRing from './ScoreRing';
import { motion } from 'framer-motion';

export default function InsightCards({ data }) {
  if (!data) return null;

  const cards = [
    {
      icon: <Activity size={16} />,
      title: 'Placement Score',
      sub: 'Overall readiness',
      accent: '#818CF8',
      content: <ScoreRing score={data.score} size={90} strokeWidth={9} />,
    },
    {
      icon: <Target size={16} />,
      title: 'Missing Skills',
      sub: `${data.missing.length} gaps found`,
      accent: '#F87171',
      content: (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {data.missing.slice(0, 2).map((skill, i) => (
            <span key={i} className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">{skill}</span>
          ))}
          {data.missing.length > 2 && (
            <span className="text-[10px] text-[#555] font-medium self-center">+{data.missing.length - 2} more</span>
          )}
        </div>
      ),
    },
    {
      icon: <Briefcase size={16} />,
      title: 'Top Roles',
      sub: 'Best career matches',
      accent: '#34D399',
      content: (
        <ul className="space-y-1.5 mt-auto">
          {(data.jobRoles || []).slice(0, 3).map((role, i) => (
            <li key={i} className="text-xs text-[#888] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-green-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
              {typeof role === 'string' ? role : role.title}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: <TrendingUp size={16} />,
      title: 'Placement Prob.',
      sub: 'Industry prediction',
      accent: '#F97316',
      content: (
        <div className="mt-auto">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="text-3xl font-black"
            style={{ color: '#F97316', textShadow: '0 0 20px rgba(249,115,22,0.4)' }}
          >
            {data.score}%
          </motion.span>
          <p className="text-[10px] text-[#444] mt-0.5">Based on 50k+ records</p>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, borderColor: `${card.accent}30` }}
          className="relative bg-[#08080A] rounded-2xl border border-[#181818] p-5 flex flex-col gap-3 col-span-1 overflow-hidden transition-colors duration-300 cursor-default"
        >
          {/* Top neon accent */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${card.accent}40, transparent)` }} />

          <div className="flex items-center gap-2">
            <div
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ background: `${card.accent}12`, border: `1px solid ${card.accent}25`, color: card.accent }}
            >
              {card.icon}
            </div>
            <div>
              <h3 className="font-black text-white text-xs sm:text-sm">{card.title}</h3>
              <p className="text-[10px] text-[#444]">{card.sub}</p>
            </div>
          </div>

          {card.content}
        </motion.div>
      ))}
    </div>
  );
}
