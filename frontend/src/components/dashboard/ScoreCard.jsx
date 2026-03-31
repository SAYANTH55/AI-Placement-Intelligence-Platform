import Card from '../common/Card';
import './ScoreCard.css';

// Dynamic scoring visualizer based on AI concepts
export default function ScoreCard({ title, value, max = 100 }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Decide color based on score thresholds
  const getColor = () => {
    if (percentage >= 80) return 'var(--success)';
    if (percentage >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <Card className="score-card">
      <div className="score-header">
        <h4>{title}</h4>
        <span className="score-value" style={{ color: getColor() }}>
          {value}/{max}
        </span>
      </div>
      <div className="score-bar-bg">
        <div 
          className="score-bar-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColor()
          }} 
        />
      </div>
    </Card>
  );
}
