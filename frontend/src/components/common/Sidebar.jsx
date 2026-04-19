import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { LayoutDashboard, FileText, Target, Activity, Briefcase, LogOut, Zap, Sparkles, ChevronDown, TrendingUp, BarChart2 } from 'lucide-react';
import Logo from '../Logo';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we are in the Profile Intelligence engine
  const profileRoutes = ['/dashboard/profile', '/dashboard/analysis', '/dashboard/skills', '/dashboard/score', '/dashboard/recommendations'];
  const isProfileActive = profileRoutes.some(route => location.pathname === route);

  const mainItems = [
    { name: 'Dashboard Hub', path: '/dashboard', icon: <LayoutDashboard size={17} />, exact: true },
    { 
      name: 'Profile Intelligence', 
      path: '/dashboard/profile', 
      icon: <Target size={17} />,
      isEngine: true,
      isActive: isProfileActive
    },
    { name: 'Preparation Engine', path: '/dashboard/preparation', icon: <Briefcase size={17} /> },
    { name: 'Practice Engine', path: '/dashboard/practice', icon: <Sparkles size={17} /> },
    { name: 'Tracking Engine', path: '/dashboard/tracking', icon: <BarChart2 size={17} /> },
  ];

  const profileSubItems = [
    { name: 'Overview', path: '/dashboard/profile', icon: <Activity size={14} /> },
    { name: 'Resume Analysis', path: '/dashboard/analysis', icon: <FileText size={14} /> },
    { name: 'Skill Gap', path: '/dashboard/skills', icon: <Target size={14} /> },
    { name: 'Score', path: '/dashboard/score', icon: <Activity size={14} /> },
    { name: 'Recommendations', path: '/dashboard/recommendations', icon: <Zap size={14} /> }
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

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

      <div className="flex-1 py-6 px-3 space-y-8 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Module Selection */}
        <div>
          <p className="text-[10px] font-black text-[#222] uppercase tracking-[0.3em] mb-4 px-3">
            System Modules
          </p>
          <nav className="space-y-1">
            {mainItems.map((item, i) => (
              <div key={item.name}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <NavLink
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden ${
                        isActive || (item.isEngine && item.isActive)
                          ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]'
                          : 'text-[#555] hover:text-white hover:bg-white/4'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {(isActive || (item.isEngine && item.isActive)) && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <span className={(isActive || (item.isEngine && item.isActive)) ? 'text-[#F97316]' : 'text-[#444] group-hover:text-[#888]'}>
                            {item.icon}
                          </span>
                          {item.name}
                        </div>
                        {item.isEngine && (
                          <ChevronDown size={14} className={`transition-transform duration-300 ${item.isActive ? 'rotate-180 text-[#F97316]' : 'opacity-20'}`} />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>

                {/* Sub-menu implementation */}
                {item.isEngine && (
                  <AnimatePresence>
                    {item.isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-4 pl-4 border-l border-[#1A1A1A] py-1 space-y-0.5">
                          {profileSubItems.map((sub, idx) => (
                            <NavLink
                              key={sub.name}
                              to={sub.path}
                              className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                                  isActive
                                    ? 'text-[#F97316] bg-[#F97316]/5'
                                    : 'text-[#444] hover:text-[#888] hover:bg-white/3'
                                }`
                              }
                            >
                              <span className="opacity-40">{sub.icon}</span>
                              {sub.name}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>
        </div>
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
      </div>
    </motion.aside>
  );
}

