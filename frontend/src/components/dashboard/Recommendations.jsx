import Card from '../common/Card';
import { Target } from 'lucide-react';
import './Recommendations.css';

export default function Recommendations({ items = [] }) {
  return (
    <Card title="AI Recommendations" className="recommendations-card">
      {items.length > 0 ? (
        <ul className="recommendation-list">
          {items.map((item, index) => (
            <li key={index} className="recommendation-item">
              <div className="icon-wrapper">
                <Target size={18} />
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-text">No specific recommendations at this time.</p>
      )}
    </Card>
  );
}
