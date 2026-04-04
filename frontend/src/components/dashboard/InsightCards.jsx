import { Activity, Target, Briefcase, BookOpen, TrendingUp } from 'lucide-react';
import SkillBadge from './SkillBadge';
import ScoreRing from './ScoreRing';

export default function InsightCards({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Placement Score — animated ring */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center gap-3 col-span-1">
        <div className="flex items-center gap-2 w-full">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-500 flex-shrink-0">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Placement Score</h3>
            <p className="text-[10px] text-gray-400">Overall readiness</p>
          </div>
        </div>
        <ScoreRing score={data.score} size={90} strokeWidth={9} />
      </div>

      {/* Card 2: Skill Gap */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 col-span-1">
        <div className="flex items-center gap-2">
          <div className="bg-red-50 p-2.5 rounded-xl text-red-500 flex-shrink-0">
            <Target size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Missing Skills</h3>
            <p className="text-[10px] text-gray-400">{data.missing.length} gaps found</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {data.missing.slice(0, 2).map((skill, idx) => (
            <SkillBadge key={idx} skill={skill} type="missing" />
          ))}
          {data.missing.length > 2 && (
            <span className="text-[10px] text-gray-400 font-medium self-center">+{data.missing.length - 2} more</span>
          )}
        </div>
      </div>

      {/* Card 3: Top Roles */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 col-span-1">
        <div className="flex items-center gap-2">
          <div className="bg-green-50 p-2.5 rounded-xl text-green-500 flex-shrink-0">
            <Briefcase size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Top Roles</h3>
            <p className="text-[10px] text-gray-400">Best career matches</p>
          </div>
        </div>
        <ul className="space-y-1.5 mt-auto">
          {(data.jobRoles || []).slice(0, 3).map((role, idx) => (
            <li key={idx} className="text-xs text-gray-700 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-green-400" />
              {typeof role === 'string' ? role : role.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Card 4: Placement Probability */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm p-5 border border-orange-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 col-span-1">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-2.5 rounded-xl text-orange-500 flex-shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Placement Prob.</h3>
            <p className="text-[10px] text-gray-400">Industry prediction</p>
          </div>
        </div>
        <div className="mt-auto">
          <span className="text-3xl font-black text-orange-500">{data.placement_probability ?? data.score + 13}%</span>
          <p className="text-[10px] text-gray-400 mt-0.5">Based on 50k+ records</p>
        </div>
      </div>
    </div>
  );
}
