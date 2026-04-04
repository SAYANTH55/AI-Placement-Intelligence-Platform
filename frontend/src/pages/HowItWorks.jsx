import { Upload, Cpu, BarChart2, Rocket, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    icon: <Upload size={28} />,
    color: 'from-orange-400 to-orange-500',
    step: '01',
    title: 'Upload Your Resume',
    desc: 'Simply drag and drop your PDF or DOCX resume into our secure upload portal. Takes less than 10 seconds — no account needed to try.'
  },
  {
    icon: <Cpu size={28} />,
    color: 'from-purple-400 to-purple-500',
    step: '02',
    title: 'AI Parses & Analyzes',
    desc: 'Our NLP engine instantly extracts your skills, experience, and education — cross-referencing against 50,000+ real placement data points.'
  },
  {
    icon: <BarChart2 size={28} />,
    color: 'from-blue-400 to-blue-500',
    step: '03',
    title: 'Get Your Intelligence Report',
    desc: 'Receive a comprehensive score, skill gap breakdown, target role recommendations, and a personalized learning roadmap — all in one view.'
  },
  {
    icon: <Rocket size={28} />,
    color: 'from-green-400 to-green-500',
    step: '04',
    title: 'Accelerate Your Career',
    desc: 'Follow the guided learning path, close your skill gaps, and apply to the best-matched companies — with confidence backed by data.'
  }
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[90vh] bg-[#F9FAFB] px-4 sm:px-8 py-16 animate-fade-in">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Cpu size={14} />
            The Pipeline
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            How It <span className="text-[#F97316]">Works</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Four simple steps from raw resume to career-ready intelligence. Our AI handles everything in seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-8 sm:left-1/2 top-10 bottom-10 w-px bg-gray-200 hidden sm:block" style={{ transform: 'translateX(-50%)' }} />

          <div className="space-y-10">
            {steps.map((s, i) => (
              <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}>
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md z-10 relative`}>
                    {s.icon}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[9px] font-black">
                    {s.step}
                  </div>
                </div>

                {/* Content */}
                <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 hover:shadow-md transition-shadow duration-200`}>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-3 bg-gray-900 text-white font-bold px-8 py-4 rounded-full hover:bg-[#F97316] transition-colors duration-200 shadow-md hover:shadow-lg text-base"
          >
            Try It Now — It's Free
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-gray-400 mt-3">No credit card required · Results in under 5 seconds</p>
        </div>
      </div>
    </div>
  );
}
