import { LogOut, Home, FileText, Briefcase, BarChart2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './Sidebar.css';

export default function Sidebar() {
  const { setUser } = useAppContext();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">AI</div>
        <h2>Placement AI</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/upload" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
               <FileText size={20} />
               <span>Resume Upload</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/job-input" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
               <Briefcase size={20} />
               <span>Job Description</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/results" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
               <BarChart2 size={20} />
               <span>Intelligence Hub</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={() => setUser(null)}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
