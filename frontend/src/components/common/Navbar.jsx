import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Zap, LogOut, User } from 'lucide-react';
import Logo from '../Logo';
import { motion } from 'framer-motion';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar() {
  const { user } = useAppContext();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/features', label: 'Features' },
    { to: '/how-it-works', label: 'How it Works' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-[100] bg-[#060606]/90 backdrop-blur-xl border-b border-[#1A1A1A] shadow-[0_4px_30px_rgba(249,115,22,0.08)] w-full"
    >
      {/* Neon orange line under navbar */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F97316]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <Logo iconSize={30} primaryText="text-sm" secondaryText="text-xs hidden sm:block" gap="gap-2.5" />
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[#F97316]'
                      : 'text-[#888] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-pill"
                        className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-[#F97316]' : 'text-[#888] hover:text-white'
                  }`
                }
              >
                Dashboard
              </NavLink>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <ProfileDropdown />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-[#F97316] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-[0_0_0px_rgba(249,115,22,0)]"
              >
                Start Hub
                <Zap size={14} className="fill-white" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
