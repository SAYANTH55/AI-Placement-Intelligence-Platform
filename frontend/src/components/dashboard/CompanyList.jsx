import Card from '../common/Card';
import { Building2 } from 'lucide-react';
import './CompanyList.css';

export default function CompanyList({ companies = [] }) {
  return (
    <Card title="Target Companies" className="company-list-card">
      <div className="company-grid">
        {companies.length > 0 ? (
          companies.map((company, index) => (
            <div key={index} className="company-item">
              <Building2 size={24} className="company-icon" />
              <span className="company-name">{company}</span>
            </div>
          ))
        ) : (
          <p className="empty-text">No specific target companies identified.</p>
        )}
      </div>
    </Card>
  );
}
