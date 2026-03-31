import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Zap } from 'lucide-react';
import Card from '../components/common/Card';
import { useAppContext } from '../context/AppContext';
import './JobInput.css';

export default function JobInput() {
  const [jobDescription, setJobDescription] = useState('');
  const { setLoading } = useAppContext();
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (!jobDescription.trim()) return;
    
    // Simulate AI Processing Delay
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/results');
    }, 1500);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Job Description</h1>
        <p className="page-subtitle">Paste the target job description to match against your resume.</p>
      </div>

      <Card className="job-input-card">
        <div className="input-header">
          <Briefcase size={24} className="input-icon" />
          <h3>Target Role Details</h3>
        </div>
        
        <textarea 
          className="job-textarea"
          placeholder="Paste the full job description here... (e.g. Responsibilities, Requirements, Tech Stack)"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={12}
        />

        <div className="input-actions">
          <button 
            className="btn-primary analyze-btn" 
            disabled={!jobDescription.trim()} 
            onClick={handleAnalyze}
          >
            <Zap size={18} /> Analyze Match
          </button>
        </div>
      </Card>
    </div>
  );
}
