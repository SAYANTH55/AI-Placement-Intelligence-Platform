import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { aiResult } from '../utils/mockData';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/dashboard/MobileNav';
import UploadBox from '../components/dashboard/UploadBox';
import InsightCards from '../components/dashboard/InsightCards';
import Tabs from '../components/dashboard/Tabs';
import SkillBadge from '../components/dashboard/SkillBadge';
import ScoreRing from '../components/dashboard/ScoreRing';
import { RefreshCw, Menu, TrendingUp, Target, Briefcase } from 'lucide-react';

// Sub-page: Resume Analysis
function AnalysisPage({ data, onAnalyzeComplete }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Resume Analysis</h2>
        <p className="text-sm text-gray-400">Deep extraction of your skills and career signals.</p>
      </div>
      {!data ? (
        <UploadBox onAnalyzeComplete={onAnalyzeComplete} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-base font-bold text-gray-900 mb-3">Parsed Resume Text</h4>
            <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 border border-gray-100 p-4 rounded-xl font-mono">
              {data.extractedText}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-base font-bold text-gray-900 mb-3">Detected Skills</h4>
            <div className="flex flex-wrap gap-2">
              {data.allDetected.map((skill, i) => (
                <SkillBadge key={i} skill={skill} type="detected" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-page: Skill Gap
function SkillsPage({ data }) {
  if (!data) return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Skill Gap Analysis</h2>
      <p className="text-sm text-gray-400 mb-6">Upload your resume on Overview to unlock skill gap details.</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
        <Target size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm font-medium">No analysis yet. Go to Overview and upload your resume.</p>
      </div>
    </div>
  );
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Skill Gap Analysis</h2>
        <p className="text-sm text-gray-400">AI mapped your resume against industry requirements.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h5 className="font-bold text-sm text-gray-700">Strong Match ({data.skills.length})</h5>
          </div>
          <div className="space-y-2">
            {data.skills.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-green-50 border border-green-100 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-green-800">{s}</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Present</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h5 className="font-bold text-sm text-gray-700">Critical Gaps ({data.missing.length})</h5>
          </div>
          <div className="space-y-2">
            {data.missing.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-red-800">{s}</span>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Missing</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-page: Placement Score
function ScorePage({ data }) {
  if (!data) return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Placement Score</h2>
      <p className="text-sm text-gray-400 mb-6">Upload your resume to get your personalized readiness score.</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
        <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm font-medium">No data yet. Upload your resume on Overview first.</p>
      </div>
    </div>
  );
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Placement Score</h2>
        <p className="text-sm text-gray-400">Your career readiness metrics across multiple dimensions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { label: 'Overall Readiness', value: data.score, description: 'Composite score across all dimensions' },
          { label: 'Interview Confidence', value: data.interview_confidence, description: 'Based on communication & tech depth' },
          { label: 'Technical Depth', value: data.technical_depth, description: 'Core engineering & algorithm strength' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
            <ScoreRing score={item.value} size={110} strokeWidth={10} />
            <div className="text-center">
              <h4 className="font-bold text-sm text-gray-800">{item.label}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-sm text-gray-800 mb-4">Target Companies</h4>
        <div className="flex flex-wrap gap-2">
          {data.companies.map((c, i) => (
            <span key={i} className="bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-full">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-page: Recommendations
function RecommendationsPage({ data }) {
  if (!data) return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Career Recommendations</h2>
      <p className="text-sm text-gray-400 mb-6">Upload your resume to unlock your personalized learning path.</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
        <Briefcase size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm font-medium">No recommendations yet. Upload your resume on Overview first.</p>
      </div>
    </div>
  );
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Career Recommendations</h2>
        <p className="text-sm text-gray-400">AI-powered learning path and role matching.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Roles */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h4 className="text-base font-bold text-gray-900 mb-4">Target Roles</h4>
          <div className="space-y-3">
            {data.jobRoles.map((role, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-gray-800 group-hover:text-orange-600 transition-colors">
                    {typeof role === 'string' ? role : role.title}
                  </h5>
                  <span className="text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                    {typeof role === 'object' ? `${role.match}% match` : 'High Match'}
                  </span>
                </div>
                {typeof role === 'object' && role.salary && (
                  <p className="text-xs text-gray-400 mt-1">{role.salary}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm p-6 border border-orange-100">
          <h4 className="text-base font-bold text-orange-700 mb-4">Your Learning Path</h4>
          <div className="space-y-3 relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-orange-200" />
            {data.recommendations.map((rec, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm z-10">
                  {i + 1}
                </div>
                <div className="bg-white border border-orange-100 rounded-xl p-3 shadow-sm text-xs text-gray-700 leading-relaxed flex-1">
                  {rec}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAppContext();
  const [analyzedData, setAnalyzedData] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyzeComplete = () => {
    setAnalyzedData(aiResult);
  };

  const handleReset = () => {
    setAnalyzedData(null);
    setActiveTab('overview');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const overviewTabContent = {
    overview: (
      <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-base font-bold text-gray-900 mb-3">Resume Parsing Output</h4>
        <div className="text-gray-600 text-sm leading-relaxed mb-6 bg-gray-50 border border-gray-100 p-4 rounded-xl font-mono">
          {analyzedData?.extractedText}
        </div>
        <h4 className="text-base font-bold text-gray-900 mb-3">Detected Skills</h4>
        <div className="flex flex-wrap gap-2">
          {analyzedData?.allDetected.map((skill, i) => (
            <SkillBadge key={i} skill={skill} type="detected" />
          ))}
        </div>
      </div>
    ),
    analysis: (
      <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-base font-bold text-gray-900 mb-1">Detailed Skill Breakdown</h4>
        <p className="text-sm text-gray-400 mb-6">AI engine mapped your capabilities against industry requirements.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <h5 className="font-bold text-sm text-gray-700">Strong Match</h5>
            </div>
            <div className="space-y-2">
              {analyzedData?.skills.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-green-50 border border-green-100 px-4 py-2.5 rounded-xl">
                  <span className="text-sm font-semibold text-green-800">{s}</span>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Present</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <h5 className="font-bold text-sm text-gray-700">Critical Gaps</h5>
            </div>
            <div className="space-y-2">
              {analyzedData?.missing.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
                  <span className="text-sm font-semibold text-red-800">{s}</span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Missing</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    recommendations: (
      <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h4 className="text-base font-bold text-gray-900 mb-4">Target Roles</h4>
          <div className="space-y-3">
            {analyzedData?.jobRoles.map((role, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-gray-800 group-hover:text-orange-600 transition-colors">
                    {typeof role === 'string' ? role : role.title}
                  </h5>
                  <span className="text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                    {typeof role === 'object' ? `${role.match}% match` : 'High Match'}
                  </span>
                </div>
                {typeof role === 'object' && role.salary && (
                  <p className="text-xs text-gray-400 mt-1">{role.salary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm p-6 border border-orange-100">
          <h4 className="text-base font-bold text-orange-700 mb-4">Your Learning Path</h4>
          <div className="space-y-3 relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-orange-200" />
            {analyzedData?.recommendations.map((rec, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm z-10">
                  {i + 1}
                </div>
                <div className="bg-white border border-orange-100 rounded-xl p-3 shadow-sm text-xs text-gray-700 leading-relaxed flex-1">
                  {rec}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  };

  // Overview Page (sub-route: /dashboard)
  const OverviewPage = () => (
    <div className="space-y-8">
      {!analyzedData ? (
        <div className="max-w-2xl">
          <UploadBox onAnalyzeComplete={handleAnalyzeComplete} />
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-sm text-blue-800">
            <div className="text-lg flex-shrink-0">ℹ️</div>
            <p className="leading-relaxed">
              Our intelligence layer cross-references your resume against{' '}
              <strong>50,000+ placement records</strong> to generate accurate career trajectories and skill gap analysis.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🎯', title: 'Skill Gap Analysis', desc: 'Instantly identify missing skills' },
              { icon: '📊', title: 'Placement Score', desc: 'Know your readiness percentile' },
              { icon: '🗺️', title: 'Career Roadmap', desc: 'Get a personalized learning path' },
            ].map((tip, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">{tip.title}</h4>
                <p className="text-xs text-gray-400">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          <InsightCards data={analyzedData} />
          <div>
            <Tabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { id: 'overview', label: 'Analysis Overview' },
                { id: 'analysis', label: 'Skill Gap Breakdown' },
                { id: 'recommendations', label: 'Career Recommendations' }
              ]}
            />
            <div className="mt-4">{overviewTabContent[activeTab]}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full overflow-y-auto">

        {/* Mobile header bar */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu size={18} />
            <span className="text-sm font-semibold">Menu</span>
          </button>
          <div className="text-sm font-bold text-gray-700">
            {greeting}, <span className="text-orange-500">{user?.name || 'User'}</span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="mb-8 hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {greeting}, <span className="text-orange-500">{user?.name || 'User'}</span> 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">Career Intelligence Dashboard — AI-powered insights at a glance.</p>
          </div>

          <div className="flex items-center gap-3">
            {analyzedData && (
              <>
                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Profile Score: <span className="text-orange-500">{analyzedData.score}%</span>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-4 py-2 rounded-full transition-colors hover:border-gray-300"
                  title="Upload new resume"
                >
                  <RefreshCw size={14} />
                  New Analysis
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile: show analyzed score banner if analyzed */}
        {analyzedData && (
          <div className="md:hidden flex items-center justify-between mb-4 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Profile Score: <span className="text-orange-500">{analyzedData.score}%</span>
            </div>
            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <RefreshCw size={12} /> Reset
            </button>
          </div>
        )}

        {/* Sub-routes for sidebar links */}
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/analysis" element={<AnalysisPage data={analyzedData} onAnalyzeComplete={handleAnalyzeComplete} />} />
          <Route path="/skills" element={<SkillsPage data={analyzedData} />} />
          <Route path="/score" element={<ScorePage data={analyzedData} />} />
          <Route path="/recommendations" element={<RecommendationsPage data={analyzedData} />} />
        </Routes>

      </div>
    </div>
  );
}
