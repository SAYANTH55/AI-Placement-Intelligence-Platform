import { Brain, Target, BarChart3, Map, Zap, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <Brain size={24} />,
    color: 'bg-purple-50 text-purple-600',
    title: 'AI Resume Parsing',
    desc: 'State-of-the-art NLP extracts skills, experience, and achievements from any resume format instantly.'
  },
  {
    icon: <Target size={24} />,
    color: 'bg-red-50 text-red-600',
    title: 'Skill Gap Detection',
    desc: 'Automatically identifies missing competencies by comparing your profile against real job requirements.'
  },
  {
    icon: <BarChart3 size={24} />,
    color: 'bg-blue-50 text-blue-600',
    title: 'Placement Score',
    desc: 'A dynamic readiness score updated in real-time as your profile evolves and the job market shifts.'
  },
  {
    icon: <Map size={24} />,
    color: 'bg-green-50 text-green-600',
    title: 'Career Roadmap',
    desc: 'Get a personalized, step-by-step learning path to bridge gaps and accelerate your placement journey.'
  },
  {
    icon: <Zap size={24} />,
    color: 'bg-orange-50 text-orange-600',
    title: 'Instant Analysis',
    desc: 'Results in seconds — no waiting. Our pipeline processes and cross-references 50,000+ data points.'
  },
  {
    icon: <Shield size={24} />,
    color: 'bg-slate-50 text-slate-600',
    title: 'Private & Secure',
    desc: 'Your data never leaves our encrypted environment. Full privacy-first architecture from day one.'
  }
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[90vh] bg-[#F9FAFB] px-4 sm:px-8 py-16 animate-fade-in">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Zap size={14} />
            Platform Capabilities
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Powerful <span className="text-[#F97316]">AI Features</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Our platform integrates state-of-the-art NLP and ML pipelines to extract dynamic insights from resumes, matching them with high-value placement opportunities.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#F97316] to-[#FFA559] rounded-3xl p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Ready to experience it?</h2>
          <p className="opacity-80 mb-6 text-sm">Upload your resume and get your career intelligence report in seconds.</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform duration-200 shadow-sm"
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
