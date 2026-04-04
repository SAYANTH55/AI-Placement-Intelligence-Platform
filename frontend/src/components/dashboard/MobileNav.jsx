import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Target, Activity, Briefcase, LogOut, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import Logo from '../Logo';

const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} />, exact: true },
    { name: 'Resume Analysis', path: '/dashboard/analysis', icon: <FileText size={18} /> },
    { name: 'Skill Gap', path: '/dashboard/skills', icon: <Target size={18} /> },
    { name: 'Placement Score', path: '/dashboard/score', icon: <Activity size={18} /> },
    { name: 'Recommendations', path: '/dashboard/recommendations', icon: <Briefcase size={18} /> }
];

export default function MobileNav({ isOpen, onClose }) {
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        setUser(null);
        navigate('/');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col md:hidden animate-fade-in">
                {/* Header */}
                <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
                    <Logo iconSize={32} primaryText="text-sm" secondaryText="hidden" gap="gap-2.5" />
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <div className="flex-1 py-5 px-3 overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Intelligence Hub</p>
                    <nav className="space-y-0.5">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.exact}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${isActive
                                        ? 'bg-orange-50 text-orange-600'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={isActive ? 'text-orange-500' : 'text-gray-400'}>
                                            {item.icon}
                                        </span>
                                        {item.name}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* User */}
                {user && (
                    <div className="px-3 pb-5">
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-800">{user.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{user.email}</p>
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
                    </div>
                )}
            </div>
        </>
    );
}
