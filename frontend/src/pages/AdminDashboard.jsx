import React from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
    LayoutDashboard, Briefcase, Users, FileText, MoreHorizontal,
    LogOut, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import sub-page components
import DashboardStats from '../components/admin/DashboardStats';
import DrivesManagement from '../components/admin/DrivesManagement';
import StudentsBatchView from '../components/admin/StudentsBatchView';
import ApplicationsManagement from '../components/admin/ApplicationsManagement';
import AnnouncementsManagement from '../components/admin/AnnouncementsManagement';
import StaffManagement from '../components/admin/StaffManagement';

export default function AdminDashboard() {
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
        { name: 'Manage Drives', path: '/admin/drives', icon: <Briefcase size={18} /> },
        { name: 'Student Batch', path: '/admin/students', icon: <Users size={18} /> },
        { name: 'Applications', path: '/admin/applications', icon: <FileText size={18} /> },
        { name: 'Announcements', path: '/admin/announcements', icon: <MoreHorizontal size={18} /> },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ name: 'Manage Staff', path: '/admin/staff', icon: <Shield size={18} /> });
    }

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('token');
        navigate('/');
    };

    const isActive = (item) =>
        item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

    return (
        <div className="flex h-screen bg-[#060606] text-white overflow-hidden font-['Inter']">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#141414] bg-[#080808] flex flex-col p-6 shrink-0">
                {/* Brand */}
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#F97316] to-[#F59E0B] rounded-xl flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h1 className="font-black text-sm tracking-tight">Admin Panel</h1>
                        <p className="text-[10px] text-[#444] font-bold uppercase tracking-wider">Placement Intel</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-[#333] font-bold mb-3 px-4">Navigation</p>
                    {menuItems.map((item, idx) => (
                        <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                    isActive(item)
                                    ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]'
                                    : 'text-[#555] hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {item.icon}
                                {item.name}
                                {isActive(item) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_6px_rgba(249,115,22,0.6)]" />}
                            </Link>
                        </motion.div>
                    ))}
                </nav>

                {/* User section */}
                <div className="pt-6 border-t border-[#141414]">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.02] border border-[#141414]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F97316] to-[#F59E0B] flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-black truncate">{user?.name}</p>
                            <p className="text-[10px] text-[#444] font-bold">Super Admin</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-[#555] hover:text-red-400 transition-colors text-sm font-bold w-full rounded-xl hover:bg-red-500/5">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-10 relative">
                <div className="absolute top-0 right-0 pointer-events-none">
                    <div className="w-96 h-96 bg-[#F97316]/5 blur-[120px] rounded-full" />
                </div>
                <div className="absolute bottom-0 left-1/4 pointer-events-none">
                    <div className="w-64 h-64 bg-[#818CF8]/3 blur-[100px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <Routes>
                        <Route path="/" element={<DashboardStats />} />
                        <Route path="/drives" element={<DrivesManagement />} />
                        <Route path="/students" element={<StudentsBatchView />} />
                        <Route path="/applications" element={<ApplicationsManagement />} />
                        <Route path="/announcements" element={<AnnouncementsManagement />} />
                        <Route path="/staff" element={<StaffManagement />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
