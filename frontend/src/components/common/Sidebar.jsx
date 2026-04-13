import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { LayoutDashboard, FileText, Target, Activity, Briefcase, LogOut, Zap } from 'lucide-react';
import Logo from '../Logo';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={17} />, exact: true },
    { name: 'Resume Analysis', path: '/dashboard/analysis', icon: <FileText size={17} /> },
    { name: 'Skill Gap', path: '/dashboard/skills', icon: <Target size={17} /> },
    { name: 'Placement Score', path: '/dashboard/score', icon: <Activity size={17} /> },
    { name: 'Recommendations', path: '/dashboard/recommendations', icon: <Briefcase size={17} /> }
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-64 bg-[#080808] border-r border-[#141414] flex-shrink-0 min-h-screen relative z-10 hidden md:flex flex-col overflow-hidden"
    >
      {/* Ambient top glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-[#F97316]/3 blur-3xl pointer-events-none" />
      {/* Vertical neon line */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#F97316]/20 to-transparent" />

      {/* Sidebar Brand */}
      <div className="px-5 py-5 border-b border-[#141414] relative z-10">
        <Logo iconSize={32} primaryText="text-sm" secondaryText="hidden" gap="gap-2.5" />
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 px-3 relative z-10">
        <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em] mb-4 px-3">
          Intelligence Hub
        </p>
        <nav className="space-y-1">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 + 0.2, duration: 0.4 }}
            >
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden ${
                    isActive
                      ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'
                      : 'text-[#555] hover:text-white hover:bg-white/4'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active left bar */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-[#F97316]' : 'text-[#444] group-hover:text-[#888]'}>
                        {item.icon}
                      </span>
                      {item.name}
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_6px_rgba(249,115,22,0.8)]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Help Card */}
      <div className="px-3 pb-4 relative z-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden rounded-2xl p-4 mb-3 cursor-default"
          style={{ background: 'linear-gradient(135deg, #F97316, #FF8C3A)' }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
            animate={{ left: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }}
          />
          <Zap size={16} className="text-white mb-2" />
          <h4 className="font-black text-sm text-white mb-0.5 relative z-10">AI Advisor</h4>
          <p className="text-xs text-white/80 relative z-10">Your career intelligence is live and learning.</p>
        </motion.div>

        {/* User + Logout */}
        {user && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0D0D0D] border border-[#1A1A1A]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-[#444] truncate max-w-[100px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#444] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
