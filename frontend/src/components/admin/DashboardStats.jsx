import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
    ArrowUpRight, BarChart3, PieChart, Users, Bell, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

// Circular icon button used in top right of cards
const CardAction = () => (
    <div className="w-10 h-10 rounded-full bg-[#1B2A4A]/[0.04] border border-[#1B2A4A]/5 flex items-center justify-center hover:bg-[#1B2A4A]/[0.1] transition-colors cursor-pointer text-secondary-muted hover:text-[#1B2A4A]">
        <ArrowUpRight size={18} />
    </div>
);

/* Custom Thick Bar Chart matching reference */
const ThickBarChart = ({ data, labels }) => {
    const maxVal = Math.max(...data);
    const activeIndex = data.indexOf(maxVal); // Highlight the peak month
    
    return (
        <div className="flex items-end justify-between h-32 mt-8">
            {data.map((val, i) => (
                <div key={i} className="flex flex-col items-center gap-4 group w-12">
                    <div className="w-full relative h-[100px] flex items-end">
                        {/* Background Track */}
                        <div className="absolute inset-0 bg-[#1B2A4A]/[0.02] rounded-xl border border-[#1B2A4A]/5" />
                        {/* Fill */}
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((val / (maxVal || 1)) * 100, 10)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`w-full rounded-xl relative z-10 flex items-start justify-center pt-2 ${
                                i === activeIndex 
                                ? 'bg-neon-gradient shadow-neon-glow' 
                                : 'bg-[#1B2A4A]/[0.05] group-hover:bg-[#1B2A4A]/[0.1]'
                            }`}
                        >
                            {i === activeIndex && (
                                <span className="text-[#1B2A4A] text-xs font-bold">{val}</span>
                            )}
                        </motion.div>
                    </div>
                    <span className="text-[11px] text-tertiary-muted font-medium">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
};

/* Custom Segmented Gauge Donut matching reference */
const SegmentedGauge = ({ growth }) => {
    const segments = 5;
    const activeSegments = 3;
    
    return (
        <div className="flex flex-col items-center mt-6">
            <div className="relative w-48 h-24 overflow-hidden mb-6">
                <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                    {/* Render segments */}
                    {[...Array(segments)].map((_, i) => {
                        const angle = (180 / segments);
                        const startAngle = 180 + (i * angle);
                        // Math to calculate SVG arc
                        const radius = 40;
                        const strokeWidth = 16;
                        // Simplification: We'll use stroke-dasharray on circles, or just a single gradient path with gaps.
                        return null; 
                    })}
                    {/* Actually, the easiest way to do a segmented gauge in SVG without complex math is a single circle with dashed stroke */}
                    <circle 
                        cx="50" cy="50" r="35" fill="none" 
                        stroke="rgba(255,255,255,0.03)" strokeWidth="18" 
                        strokeDasharray="18 4" strokeLinecap="butt"
                    />
                    <circle 
                        cx="50" cy="50" r="35" fill="none" 
                        stroke="url(#neon-grad)" strokeWidth="18" 
                        strokeDasharray="18 4" strokeDashoffset="0"
                        strokeLinecap="butt"
                        pathLength="100"
                    />
                    {/* Masking out the right side to simulate the active segments */}
                    <circle 
                        cx="50" cy="50" r="35" fill="none" 
                        stroke="rgba(255,255,255,0.03)" strokeWidth="20" 
                        strokeDasharray="44 100" strokeDashoffset="-56"
                        strokeLinecap="butt"
                        pathLength="100"
                    />
                    <defs>
                        <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1B2A4A" />
                            <stop offset="100%" stopColor="#9ECCFA" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            
            <div className="border border-[#1B2A4A]/10 rounded-full px-5 py-2.5 bg-[#1B2A4A]/[0.02]">
                <p className="text-[11px] text-[#1B2A4A] font-medium">
                    Placement rate has increased by <span className="font-bold">{growth}%</span>
                </p>
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
        <div className="flex items-center justify-center py-20 h-full">
            <div className="w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const totalStudents = stats?.total_students || 0;
    const placementRate = stats?.placement_rate || 0;
    const placedStudents = Math.round(totalStudents * (placementRate / 100));
    const activeDrives = driveStats?.active_drives || 0;
    const selectionRate = driveStats?.selection_rate || 0;
    const appsPerDrive = driveStats?.applications_per_drive || 0;
    const growthRate = stats?.growth_vs_last_year || 8.02;

    // Real monthly data from API
    const monthlyData = stats?.monthly_apps?.data || [0, 0, 0, 0, 0];
    const monthlyLabels = stats?.monthly_apps?.labels || ['-', '-', '-', '-', '-'];

    // Real batch stats from API
    const batchStats = stats?.batch_stats || [];
    
    // Real recent activity from API
    const recentActivity = stats?.recent_activity || [];

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-full pb-10">
            {/* Left Column - 65% */}
            <div className="w-full xl:w-[65%] flex flex-col gap-6">
                
                {/* 1. Big Top Card: Total Students & Placement Progress */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-[32px] shadow-card-depth border border-white/[0.03]">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-[56px] font-normal leading-none text-[#1B2A4A] tracking-tight mb-2">
                                {totalStudents.toLocaleString()}
                            </h2>
                            <p className="text-[13px] text-secondary-muted font-medium">Total Registered Students</p>
                        </div>
                        <CardAction />
                    </div>
                    
                    {/* Massive Progress Bar */}
                    <div className="relative h-10 bg-[#1B2A4A]/[0.03] rounded-full overflow-hidden flex items-center border border-[#1B2A4A]/5 p-1 mb-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${placementRate}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="h-full bg-neon-gradient rounded-full shadow-neon-glow flex items-center justify-end pr-3"
                        >
                            <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[#1B2A4A]">
                                <ArrowUpRight size={14} />
                            </div>
                        </motion.div>
                    </div>
                    <p className="text-[11px] text-tertiary-muted font-medium">
                        Overall placement rate has increased by {growthRate}% vs last year
                    </p>
                </motion.div>

                {/* 2. Middle Row: Two Charts */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Chart: Bar Chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 glass-panel p-8 rounded-[32px] shadow-card-depth border border-white/[0.03]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-medium text-[#1B2A4A] mb-1">Monthly Apps</h3>
                                <p className="text-[11px] text-secondary-muted">Statistics by Month</p>
                            </div>
                            <CardAction />
                        </div>
                        <ThickBarChart 
                            data={monthlyData} 
                            labels={monthlyLabels} 
                        />
                    </motion.div>

                    {/* Right Chart: Segmented Gauge */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 glass-panel p-8 rounded-[32px] shadow-card-depth border border-white/[0.03]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-medium text-[#1B2A4A] mb-1">{placementRate}%</h3>
                                <p className="text-[11px] text-secondary-muted">Placement Ratio</p>
                            </div>
                            <CardAction />
                        </div>
                        <SegmentedGauge growth={growthRate} />
                        {/* Note: SegmentedGauge already has a growth message internally, we could pass growthRate there if needed */}
                    </motion.div>
                </div>

                {/* 3. Bottom Row: Lists */}
                <div className="flex flex-col md:flex-row gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex-1 glass-panel p-8 rounded-[32px] shadow-card-depth border border-white/[0.03]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-medium text-[#1B2A4A] mb-1">Batch Stats</h3>
                                <p className="text-[11px] text-secondary-muted">Performance by year</p>
                            </div>
                            <CardAction />
                        </div>
                        <div className="space-y-4">
                            {batchStats.length > 0 ? batchStats.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/[0.03] flex items-center justify-center text-[#1B2A4A]/50">
                                            <Users size={14} />
                                        </div>
                                        <span className="text-[13px] text-secondary-muted font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-lg text-[#1B2A4A] font-medium">{item.val}</span>
                                </div>
                            )) : (
                                <p className="text-xs text-tertiary-muted italic">No batch data available</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 glass-panel p-8 rounded-[32px] shadow-card-depth border border-white/[0.03]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-medium text-[#1B2A4A] mb-1">Recent Activity</h3>
                                <p className="text-[11px] text-secondary-muted">Latest system events</p>
                            </div>
                            <CardAction />
                        </div>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/[0.03] flex items-center justify-center text-[#1B2A4A]/50">
                                            {item.type === 'drive' ? <Briefcase size={14} /> : <Bell size={14} />}
                                        </div>
                                        <span className="text-[13px] text-secondary-muted font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-sm text-[#1B2A4A] font-medium">{item.val}</span>
                                </div>
                            )) : (
                                <p className="text-xs text-tertiary-muted italic">No recent activity</p>
                            )}
                        </div>
                    </motion.div>
                </div>

            </div>

            {/* Right Column - 35% */}
            <div className="w-full xl:w-[35%] flex flex-col gap-6">
                
                {/* Top 2x2 Grid Panel */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-8 rounded-[32px] shadow-card-depth border border-white/[0.03] flex-1">
                    <div className="flex justify-between items-start mb-10">
                        <h2 className="text-3xl font-medium text-[#1B2A4A] leading-tight pr-10">
                            Key Platform<br />Metrics
                        </h2>
                        <CardAction />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Active Drives', val: activeDrives },
                            { label: 'Apps / Drive', val: appsPerDrive },
                            { label: 'Selection Rate', val: `${selectionRate}%` },
                            { label: 'Placed Students', val: placedStudents }
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#1B2A4A]/[0.02] border border-white/[0.03] rounded-2xl p-6 hover:bg-[#1B2A4A]/[0.04] transition-colors">
                                <p className="text-[11px] text-secondary-muted mb-3">{stat.label}</p>
                                <p className="text-[28px] text-[#1B2A4A] font-medium">{stat.val}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom Promo Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-neon-gradient p-10 rounded-[32px] shadow-neon-glow relative overflow-hidden min-h-[300px] flex items-end">
                    {/* Decorative wireframe globe/grid in background */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <svg viewBox="0 0 100 100" className="w-full h-full scale-150 origin-bottom-right">
                            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
                            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
                            <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
                            <circle cx="100" cy="100" r="20" fill="none" stroke="white" strokeWidth="0.5" />
                            {/* Radial lines */}
                            <line x1="100" y1="100" x2="0" y2="0" stroke="white" strokeWidth="0.5" />
                            <line x1="100" y1="100" x2="20" y2="0" stroke="white" strokeWidth="0.5" />
                            <line x1="100" y1="100" x2="0" y2="50" stroke="white" strokeWidth="0.5" />
                        </svg>
                    </div>

                    <h2 className="text-[32px] font-medium text-[#1B2A4A] leading-[1.1] relative z-10 w-4/5">
                        Analyze Placement<br />Intelligence instantly
                    </h2>
                </motion.div>

            </div>
        </div>
    );
}
