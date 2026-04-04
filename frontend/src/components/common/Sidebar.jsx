import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { LayoutDashboard, FileText, Target, Activity, Briefcase, LogOut, ChevronRight } from 'lucide-react';
import Logo from '../Logo';

export default function Sidebar() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} />, exact: true },
    { name: 'Resume Analysis', path: '/dashboard/analysis', icon: <FileText size={18} /> },
    { name: 'Skill Gap', path: '/dashboard/skills', icon: <Target size={18} /> },
    { name: 'Placement Score', path: '/dashboard/score', icon: <Activity size={18} /> },
    { name: 'Recommendations', path: '/dashboard/recommendations', icon: <Briefcase size={18} /> }
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  // Get user initials
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex-shrink-0 min-h-screen relative z-10 hidden md:flex flex-col">
      {/* Sidebar Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Logo iconSize={32} primaryText="text-sm" secondaryText="hidden" gap="gap-2.5" />
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-5 px-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Intelligence Hub</p>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 group ${isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}>
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                  {isActive && <ChevronRight size={14} className="text-orange-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Help Card */}
      <div className="px-3 pb-4">
        <div className="bg-gradient-to-br from-[#F97316] to-[#FFA559] rounded-2xl p-4 text-white relative overflow-hidden mb-3">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          <h4 className="font-bold text-sm mb-0.5 relative z-10">Need Help?</h4>
          <p className="text-xs opacity-80 relative z-10">Contact your AI career advisor anytime.</p>
        </div>

        {/* User + Logout */}
        {user && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              {/* Avatar circle with initials */}
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
