import { User } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Mobile menu toggle would go here */}
        <div className="navbar-spacer"></div>
        
        <div className="navbar-actions">
          <div className="user-profile">
            <div className="avatar">
              <User size={20} />
            </div>
            <span>Student Portal</span>
          </div>
        </div>
      </div>
    </header>
  );
}
