import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  LayoutDashboard, FileText, Target, Activity, Briefcase,
  Zap, Sparkles, ChevronDown, BarChart2, User, BookOpen
} from 'lucide-react';
import Logo from '../Logo';
import { motion, AnimatePresence } from 'framer-motion';

/* Icon map: each engine gets a rounded-square icon container exactly like the reference */
function EngineIcon({ icon: Icon, color, size = 16 }) {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <Icon size={size} style={{ color }} />
    </div>
  );
}

export default function Sidebar() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const profileRoutes = ['/dashboard/profile', '/dashboard/analysis', '/dashboard/skills', '/dashboard/score', '/dashboard/recommendations'];
  const isProfileActive = profileRoutes.some(route => location.pathname === route);

  const mainItems = [
    {
      name: 'Dashboard Hub',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: '#888',
      exact: true,
    },
    {
      name: 'Profile Intelligence',
      path: '/dashboard/profile',
      icon: Target,
      color: '#F97316',
      isEngine: true,
      isActive: isProfileActive,
    },
    { name: 'Preparation Engine', path: '/dashboard/preparation', icon: BookOpen,      color: '#34D399' },
    { name: 'Practice Engine',    path: '/dashboard/practice',    icon: Sparkles,      color: '#818CF8' },
    { name: 'Tracking Engine',    path: '/dashboard/tracking',    icon: BarChart2,     color: '#F59E0B' },
    { name: 'Placement Engine',   path: '/dashboard/placement',   icon: Briefcase,     color: '#F97316' },
  ];

  if (user?.role === 'student') {
    mainItems.push({ name: 'My Profile', path: '/dashboard/my-profile', icon: User, color: '#888' });
  }

  const profileSubItems = [
    { name: 'Overview',         path: '/dashboard/profile',          icon: Activity,  color: '#F97316' },
    { name: 'Resume Analysis',  path: '/dashboard/analysis',         icon: FileText,  color: '#888' },
    { name: 'Skill Gap',        path: '/dashboard/skills',           icon: Target,    color: '#888' },
    { name: 'Score',            path: '/dashboard/score',            icon: Activity,  color: '#888' },
    { name: 'Recommendations',  path: '/dashboard/recommendations',  icon: Zap,       color: '#888' },
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-64 flex-shrink-0 min-h-screen relative z-10 hidden md:flex flex-col overflow-hidden bg-sidebar-surface"
      style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Logo iconSize={32} primaryText="text-sm" secondaryText="hidden" gap="gap-2.5" />
      </div>

      {/* Nav */}
      <div className="flex-1 py-5 px-3 relative z-10 overflow-y-auto">
        {/* Section label */}
        <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 px-3" style={{ color: '#333' }}>
          System Modules
        </p>

        <nav className="space-y-0.5">
          {mainItems.map((item, i) => (
            <div key={item.name}>
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <NavLink
                  to={item.path}
                  end={item.exact}
                  className="group relative"
                >
                  {({ isActive }) => {
                    const active = isActive || (item.isEngine && item.isActive);
                    return (
                      <div
                        className="flex items-center justify-between px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer"
                        style={{
                          background: active ? `${item.color}14` : 'transparent',
                          border: active ? `1px solid ${item.color}28` : '1px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Rounded-square icon container — matches reference exactly */}
                          <EngineIcon icon={item.icon} color={active ? item.color : '#333'} />
                          <span
                            className="text-sm font-semibold transition-colors duration-150"
                            style={{ color: active ? '#ffffff' : '#555' }}
                          >
                            {item.name}
                          </span>
                        </div>

                        {item.isEngine && (
                          <ChevronDown
                            size={13}
                            style={{
                              color: active ? item.color : '#333',
                              transform: item.isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s',
                            }}
                          />
                        )}

                        {/* Left neon bar */}
                        {active && (
                          <motion.div
                            layoutId="sidebar-bar"
                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                            style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                          />
                        )}
                      </div>
                    );
                  }}
                </NavLink>
              </motion.div>

              {/* Profile sub-menu */}
              {item.isEngine && (
                <AnimatePresence>
                  {item.isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'circOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-5 pl-4 py-1 space-y-0.5" style={{ borderLeft: '1px solid #1e1e1e' }}>
                        {profileSubItems.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                isActive
                                  ? 'text-[#F97316] bg-[#F97316]/8'
                                  : 'text-[#444] hover:text-[#888]'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <sub.icon size={12} style={{ color: isActive ? '#F97316' : '#333', flexShrink: 0 }} />
                                {sub.name}
                              </>
                            )}
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

      {/* AI Advisor card at bottom — matches reference orange CTA */}
      <div className="px-3 pb-4 flex-shrink-0 relative z-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden rounded-2xl p-4 cursor-default"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #FF8C3A 100%)' }}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
            animate={{ left: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }}
          />
          <Zap size={16} className="text-white mb-2 relative z-10" />
          <h4 className="font-black text-sm text-white mb-0.5 relative z-10">AI Advisor</h4>
          <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Your career intelligence is live.
          </p>
        </motion.div>
      </div>
    </motion.aside>
  );
}
