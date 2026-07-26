import React from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
    LayoutDashboard, Briefcase, Users, FileText, MoreHorizontal,
    LogOut, Shield, Search, Bell, Plus, Grid, Calendar, Link2, UserPlus, Zap, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import sub-page components
import PlacementAdminDashboard from '../components/placement/PlacementAdminDashboard';
import DashboardStats from '../components/admin/DashboardStats';
import DrivesManagement from '../components/admin/DrivesManagement';
import StudentsBatchView from '../components/admin/StudentsBatchView';
import ApplicationsManagement from '../components/admin/ApplicationsManagement';
import AnnouncementsManagement from '../components/admin/AnnouncementsManagement';
import StaffManagement from '../components/admin/StaffManagement';
import StudentManagement from '../components/admin/StudentManagement';
import PRMappings from '../components/admin/PRMappings';

export default function AdminDashboard() {
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
        { name: 'Placement Engine', path: '/admin/placement-engine', icon: <Zap size={18} /> },
        { name: 'Manage Drives', path: '/admin/drives', icon: <Briefcase size={18} /> },
        { name: 'Students', path: '/admin/students', icon: <UserPlus size={18} /> },
        { name: 'PR Mappings', path: '/admin/pr-mappings', icon: <Link2 size={18} /> },
        { name: 'Batch View', path: '/admin/batch-view', icon: <Users size={18} /> },
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
        <div className="flex w-full flex-1 bg-dashboard-base text-[#1B2A4A] overflow-hidden font-['Inter'] relative">
            
            {/* Massive Background Glowing Orbs */}
            <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#1B2A4A] opacity-[0.08] blur-[180px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-[#9ECCFA] opacity-[0.06] blur-[200px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] right-[20%] w-[500px] h-[500px] bg-[#1B2A4A] opacity-[0.04] blur-[150px] rounded-full pointer-events-none" />

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-8 relative z-10 w-full h-full">


                {/* Sub-Navigation Tabs */}
                <nav className="flex flex-wrap items-center gap-2 mb-8 w-full max-w-[1600px] mx-auto px-4 pb-2">
                    {menuItems.map((item) => {
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                                    active
                                    ? 'bg-white text-[#1B2A4A] border-[#1B2A4A]/10 shadow-[0_4px_12px_rgba(27,42,74,0.08)] scale-[1.02]'
                                    : 'bg-transparent text-[#1B2A4A]/60 border-transparent hover:bg-white/60 hover:text-[#1B2A4A] hover:border-[#1B2A4A]/5'
                                }`}
                            >
                                <span className={`${active ? 'text-[#3B82F6]' : 'text-inherit opacity-70'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4">
                    <Routes>
                        <Route path="/" element={<DashboardStats />} />
                        <Route path="/placement-engine" element={<PlacementAdminDashboard />} />
                        <Route path="/drives" element={<DrivesManagement />} />
                        <Route path="/students" element={<StudentManagement />} />
                        <Route path="/pr-mappings" element={<PRMappings />} />
                        <Route path="/batch-view" element={<StudentsBatchView />} />
                        <Route path="/applications" element={<ApplicationsManagement />} />
                        <Route path="/announcements" element={<AnnouncementsManagement />} />
                        <Route path="/staff" element={<StaffManagement />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
