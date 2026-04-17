import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: <LayoutDashboard size={14} />, 
      onClick: () => { navigate('/dashboard'); setIsOpen(false); } 
    },
    { 
      label: 'Settings', 
      icon: <Settings size={14} />, 
      onClick: () => { /* Add settings page later */ setIsOpen(false); } 
    },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-2 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#F97316]/40 transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all">
          {initials}
        </div>
        <ChevronDown size={14} className={`text-[#555] group-hover:text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-56 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-[100]"
          >
            {/* User Info Section */}
            <div className="p-4 bg-gradient-to-br from-[#111] to-[#0A0A0A] border-b border-[#1A1A1A]">
              <p className="text-xs font-black text-[#888] uppercase tracking-widest mb-2">Account</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black text-sm shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-black text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-[#555] font-medium truncate">{user.email || 'student@university.edu'}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#888] hover:text-white hover:bg-white/5 transition-all group"
                >
                  <span className="text-[#333] group-hover:text-[#F97316] transition-colors">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-[#1A1A1A] my-2 mx-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-all group"
              >
                <span className="text-[#333] group-hover:text-red-400 transition-colors">
                  <LogOut size={14} />
                </span>
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
