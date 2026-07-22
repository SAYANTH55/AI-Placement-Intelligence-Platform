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
      {/* Bordered pill trigger: avatar · name · chevron */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#C9C2AF] bg-white hover:border-[#1B2A4A]/40 hover:bg-[#F4EFE4] transition-all group shadow-sm"
      >
        {/* Initials avatar */}
        <div className="w-7 h-7 rounded-full bg-[#1B2A4A] flex items-center justify-center font-black text-[11px] text-white flex-shrink-0">
          {initials}
        </div>
        {/* Name — hidden on very small screens */}
        <span className="hidden sm:block text-sm font-semibold text-[#1B2A4A] leading-none max-w-[120px] truncate">
          {user?.name?.split(' ')[0] || 'Account'}
        </span>
        <ChevronDown size={13} className={`text-[#6B6B63] group-hover:text-[#1B2A4A] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden z-[100]"
          >
            {/* User Info Section */}
            <div className="p-4 bg-[#F4EFE4] border-b border-[#E4DED0]">
              <p className="text-[9px] font-black text-[#9A968A] uppercase tracking-widest mb-2">Account</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] flex items-center justify-center font-black text-sm text-white">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#1B2A4A] truncate">{user.name}</p>
                  <p className="text-[10px] text-[#9A968A] font-medium truncate">{user.email || 'student@university.edu'}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#6B6B63] hover:text-[#1B2A4A] hover:bg-[#F4EFE4] transition-all group"
                >
                  <span className="text-[#9A968A] group-hover:text-[#1B2A4A] transition-colors">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-[#E4DED0] my-2 mx-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#6B6B63] hover:text-[#791F1F] hover:bg-[#FCEBEB] transition-all group"
              >
                <span className="text-[#9A968A] group-hover:text-[#F09595] transition-colors">
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
