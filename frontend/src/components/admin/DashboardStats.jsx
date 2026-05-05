import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import {
    Users, Award, FileText, CheckCircle, TrendingUp, TrendingDown,
    Briefcase, Clock, Target, BarChart3, PieChart, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, color = 'text-white', suffix = '', icon, trend, trendValue, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-[#08080A] border border-[#181818] rounded-2xl p-5 shadow-[0_0_20px_rgba(249,115,22,0.02)] flex flex-col justify-between hover:border-[#F97316]/20 transition-all group"
    >
        <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold">{label}</p>
            <div className="p-2 bg-[#F97316]/10 rounded-lg text-[#F97316] group-hover:bg-[#F97316]/20 transition-colors">
                {icon}
            </div>
        </div>
        <p className={`text-3xl font-black ${color}`}>
            {value ?? '—'}{suffix}
        </p>
        {trend && (
            <div className={`flex items-center gap-1 mt-3 text-[10px] font-bold ${trend === 'up' ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trendValue} vs last month</span>
            </div>
        )}
    </motion.div>
);

/* Mini bar chart drawn with CSS */
const MiniBarChart = ({ data, maxVal }) => (
    <div className="flex items-end gap-1 h-16">
        {data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                    className="w-full bg-gradient-to-t from-[#F97316] to-[#F59E0B] rounded-t-sm transition-all duration-500 min-h-[2px]"
                    style={{ height: `${Math.max((val / (maxVal || 1)) * 100, 4)}%` }}
                />
            </div>
        ))}
    </div>
);

/* Donut chart using SVG */
const DonutChart = ({ placed, total }) => {
    const pct = total > 0 ? (placed / total) * 100 : 0;
    const r = 40;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    return (
        <div className="relative w-28 h-28 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#1A1A1A" strokeWidth="8" />
                <motion.circle
                    cx="50" cy="50" r={r} fill="none" stroke="url(#grad)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{Math.round(pct)}%</span>
                <span className="text-[9px] text-[#555] font-bold">PLACED</span>
            </div>
        </div>
    );
};

export default function DashboardStats() {
    const [stats, setStats] = useState(null);
    const [driveStats, setDriveStats] = useState(null);
    const [prStats, setPRStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            API.get('/admin/stats'),
            API.get('/admin/drive-stats'),
            API.get('/admin/pr-stats'),
        ]).then(([s, d, p]) => {
            setStats(s.data.data);
            setDriveStats(d.data.data);
            setPRStats(p.data.data);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const totalStudents = stats?.total_students || 0;
    const placedStudents = Math.round(totalStudents * ((stats?.placement_rate || 0) / 100));
    const monthlyData = [12, 19, 8, 25, 14, 22, 30, 18, 26, 15, 28, 32];

    return (
        <div className="space-y-8">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-black tracking-tight">Placement Dashboard</h1>
                <p className="text-xs text-[#555] mt-1">Real-time overview of placement activity and student performance</p>
            </motion.div>

            {/* Stat cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Students" value={totalStudents} icon={<Users size={16} />} trend="up" trendValue="+12%" delay={0} />
                <StatCard label="Placement Rate" value={stats?.placement_rate} suffix="%" color="text-[#34D399]" icon={<Award size={16} />} trend="up" trendValue="+5.2%" delay={0.1} />
                <StatCard label="Apps / Drive" value={driveStats?.applications_per_drive} color="text-[#F97316]" icon={<FileText size={16} />} trend="up" trendValue="+8%" delay={0.2} />
                <StatCard label="Selection Rate" value={driveStats?.selection_rate} suffix="%" color="text-[#818CF8]" icon={<CheckCircle size={16} />} trend="down" trendValue="-2.1%" delay={0.3} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Applications Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-[#08080A] border border-[#181818] rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black flex items-center gap-2">
                                <BarChart3 size={16} className="text-[#F97316]" />
                                Monthly Applications
                            </h3>
                            <p className="text-[10px] text-[#444] mt-1">Trend over the last 12 months</p>
                        </div>
                        <div className="flex gap-2">
                            {['6M', '1Y'].map(p => (
                                <button key={p} className="px-3 py-1 rounded-lg text-[10px] font-bold bg-white/5 text-[#555] hover:text-white hover:bg-white/10 transition-all">
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <MiniBarChart data={monthlyData} maxVal={Math.max(...monthlyData)} />
                    <div className="flex justify-between mt-2 text-[9px] text-[#333] font-bold">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                            <span key={m}>{m}</span>
                        ))}
                    </div>
                </motion.div>

                {/* Donut Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-[#08080A] border border-[#181818] rounded-3xl p-6 flex flex-col items-center justify-center"
                >
                    <h3 className="text-sm font-black flex items-center gap-2 mb-6 self-start">
                        <PieChart size={16} className="text-[#34D399]" />
                        Placement Ratio
                    </h3>
                    <DonutChart placed={placedStudents} total={totalStudents} />
                    <div className="flex gap-6 mt-6 text-[10px]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#34D399]" />
                            <span className="text-[#888] font-bold">Placed ({placedStudents})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#333]" />
                            <span className="text-[#888] font-bold">Pending ({totalStudents - placedStudents})</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Batch Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="bg-[#08080A] border border-[#181818] rounded-3xl p-6"
                >
                    <h3 className="text-sm font-black flex items-center gap-2 mb-5">
                        <Target size={16} className="text-[#818CF8]" />
                        Batch Performance
                    </h3>
                    <div className="space-y-3">
                        {[
                            { batch: '2026', rate: 78, students: 120, color: 'from-[#F97316] to-[#F59E0B]' },
                            { batch: '2025', rate: 85, students: 145, color: 'from-[#34D399] to-[#6EE7B7]' },
                            { batch: '2024', rate: 92, students: 130, color: 'from-[#818CF8] to-[#A78BFA]' },
                        ].map(b => (
                            <div key={b.batch} className="p-4 bg-[#050505] rounded-xl border border-[#141414] hover:border-[#222] transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-sm font-black">Class of {b.batch}</span>
                                        <span className="text-[10px] text-[#444] ml-2">({b.students} students)</span>
                                    </div>
                                    <span className="text-xs font-black text-[#F97316]">{b.rate}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${b.rate}%` }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                        className={`h-full bg-gradient-to-r ${b.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Upcoming Deadlines & Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-[#08080A] border border-[#181818] rounded-3xl p-6"
                >
                    <h3 className="text-sm font-black flex items-center gap-2 mb-5">
                        <Activity size={16} className="text-[#F97316]" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {[
                            { text: 'New drive posted: Google – SDE Intern', time: '2 hours ago', dot: 'bg-[#F97316]' },
                            { text: '15 applications received for Microsoft drive', time: '5 hours ago', dot: 'bg-[#818CF8]' },
                            { text: 'Round 2 results updated for Amazon', time: '1 day ago', dot: 'bg-[#34D399]' },
                            { text: 'Batch 2026 report generated', time: '2 days ago', dot: 'bg-[#F59E0B]' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-[#050505] rounded-xl border border-[#141414] hover:border-[#222] transition-all">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${item.dot} shrink-0`} />
                                <div>
                                    <p className="text-xs font-bold text-[#ccc]">{item.text}</p>
                                    <p className="text-[10px] text-[#444] mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
