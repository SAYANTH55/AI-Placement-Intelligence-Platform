import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Zap, LogOut, User } from 'lucide-react';
import Logo from '../Logo';

export default function Navbar() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/features', label: 'Features' },
    { to: '/how-it-works', label: 'How it Works' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
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
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-orange-500 bg-orange-50'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <User size={14} />
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-semibold text-white bg-gray-900 px-4 py-2 rounded-full hover:bg-orange-500 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#F97316] transition-all duration-200 shadow-sm hover:shadow"
              >
                Start Hub
                <Zap size={14} className="text-orange-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
