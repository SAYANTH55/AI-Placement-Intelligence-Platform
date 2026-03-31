import { useAppContext } from '../context/AppContext';
import ScoreCard from '../components/dashboard/ScoreCard';
import SkillGapList from '../components/dashboard/SkillGapList';
import Recommendations from '../components/dashboard/Recommendations';
import CompanyList from '../components/dashboard/CompanyList';
import Loader from '../components/common/Loader';
import Card from '../components/common/Card';
import './Results.css';

export default function Results() {
  const { result, loading } = useAppContext();

  if (loading) {
    return <div className="page-container flex-center" style={{minHeight: '80vh'}}><Loader text="AI is analyzing your profile..." /></div>;
  }

  if (!result) {
    return <div className="page-container flex-center">No results found. Please upload a resume first.</div>;
  }

  return (
    <div className="page-container animate-fade-in results-dashboard">
      <div className="page-header dynamic-header">
        <div>
          <h1 className="page-title">Intelligence Dashboard</h1>
          <p className="page-subtitle">AI-driven insights for your career trajectory.</p>
        </div>
        <div className="probability-badge">
           Placement Probability: <span>{result.placement_probability}%</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Top Row: Core Scores */}
        <div className="dashboard-row scores-row">
          <ScoreCard title="Match Score" value={result.scores?.match || 0} />
          <ScoreCard title="Resume Score" value={result.scores?.resume || 0} />
          
          {/* AI-Integrative Dynamic Rendering for future scores */}
          {result.dynamic_scores && Object.entries(result.dynamic_scores).map(([key, value]) => (
            <ScoreCard 
              key={key} 
              title={key.replace(/_/g, ' ')} 
              value={value} 
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="dashboard-row content-row">
           <div className="main-column">
             <SkillGapList skills={result.skills} />
             <div style={{height: '24px'}}></div>
             <Recommendations items={result.recommendations} />
           </div>
           
           <div className="side-column">
              <CompanyList companies={result.companies} />
              
              {/* Placement Probability Detailed Card */}
              <Card title="Market Readiness" className="mt-24">
                 <div className="readiness-visualizer flex-center">
                    <div className="progress-circle" style={{ '--prob': `${result.placement_probability}%` }}>
                       <div className="circle-inner">
                          {result.placement_probability}%
                       </div>
                    </div>
                 </div>
                 <p className="text-center mt-16 text-muted">
                    Based on current market trends and your skill profile against the target JD.
                 </p>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
