import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Zap, LogOut, User, Menu, X } from 'lucide-react';
import Logo from '../Logo';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileDropdown from './ProfileDropdown';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/features', label: 'Features' },
    { to: '/how-it-works', label: 'How it Works' },
    { to: '/contact', label: 'Contact' },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const isDashActive = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-[100] bg-[#F4EFE4]/90 backdrop-blur-xl border-b border-[#C9C2AF] shadow-[0_4px_30px_rgba(27,42,74,0.08)] w-full"
    >
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1B2A4A]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div onClick={() => navigate('/')} className="cursor-pointer z-50">
            <Logo iconSize={28} primaryText="text-sm font-bold" secondaryText="text-[10px] hidden sm:block" gap="gap-2" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-[#1B2A4A]' : 'text-[#6B6B63] hover:text-[#1B2A4A]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-pill"
                        className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#1B2A4A] shadow-[0_0_8px_rgba(27,42,74,0.8)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to={user.role === 'admin' || user.role === 'pr' ? '/admin' : '/dashboard'}
                className={() =>
                  `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDashActive ? 'text-[#1B2A4A]' : 'text-[#6B6B63] hover:text-[#1B2A4A]'
                  }`
                }
              >
                Dashboard
                {isDashActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#1B2A4A]"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </NavLink>
            )}
          </nav>

          {/* Right Actions & Hamburger */}
          <div className="flex items-center gap-3 md:gap-4 z-50">
            {user ? (
              <div className="hidden sm:block">
                <ProfileDropdown />
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(27,42,74,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-2 bg-[#1B2A4A] text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              >
                Start Hub
                <Zap size={14} className="fill-white" />
              </motion.button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-[#1B2A4A] hover:bg-[#1B2A4A]/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden fixed inset-0 top-16 bg-[#F4EFE4] z-[90] flex flex-col px-6 py-8 overflow-y-auto"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `text-2xl font-bold py-3 border-b border-[#1B2A4A]/10 transition-colors ${
                      isActive ? 'text-[#1B2A4A]' : 'text-[#1B2A4A]/60'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              {user && (
                <NavLink
                  to={user.role === 'admin' || user.role === 'pr' ? '/admin' : '/dashboard'}
                  className={() =>
                    `text-2xl font-bold py-3 border-b border-[#1B2A4A]/10 transition-colors ${
                      isDashActive ? 'text-[#1B2A4A]' : 'text-[#1B2A4A]/60'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              )}
            </nav>
            
            <div className="mt-auto pt-8 flex flex-col gap-4">
              {user ? (
                <button
                  onClick={() => navigate(user.role === 'admin' || user.role === 'pr' ? '/admin' : '/dashboard')}
                  className="w-full flex justify-center items-center gap-2 bg-[#1B2A4A] text-white px-6 py-4 rounded-xl text-lg font-semibold"
                >
                  Go to Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center items-center gap-2 bg-[#1B2A4A] text-white px-6 py-4 rounded-xl text-lg font-semibold"
                >
                  Start Hub
                  <Zap size={18} className="fill-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
