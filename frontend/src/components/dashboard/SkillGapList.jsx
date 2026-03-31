import Card from '../common/Card';
import { XCircle, CheckCircle } from 'lucide-react';
import './SkillGapList.css';

export default function SkillGapList({ skills = {} }) {
  const missing = skills.missing || [];
  const present = skills.present || [];

  return (
    <Card title="Skill Analysis" className="skill-gap-card">
      <div className="skill-section">
        <h4 className="flex-center" style={{justifyContent: 'flex-start', gap: '8px', color: 'var(--success)'}}>
          <CheckCircle size={18} /> Present Skills
        </h4>
        <div className="skill-tags">
          {present.length > 0 ? (
            present.map((skill, i) => <span key={i} className="tag tag-success">{skill}</span>)
          ) : (
            <p className="empty-text">No matching skills found.</p>
          )}
        </div>
      </div>

      <div className="skill-section mt-4">
        <h4 className="flex-center" style={{justifyContent: 'flex-start', gap: '8px', color: 'var(--danger)'}}>
          <XCircle size={18} /> Missing Skills
        </h4>
        <div className="skill-tags">
          {missing.length > 0 ? (
            missing.map((skill, i) => <span key={i} className="tag tag-danger">{skill}</span>)
          ) : (
            <p className="empty-text">No missing critical skills!</p>
          )}
        </div>
      </div>
    </Card>
  );
}
