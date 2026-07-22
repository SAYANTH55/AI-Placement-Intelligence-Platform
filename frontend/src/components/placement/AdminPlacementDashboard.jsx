import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const StatCard = ({ label, value, color = 'text-[#1B2A4A]', suffix = '' }) => (
    <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(27,42,74,0.03)] flex flex-col justify-center">
        <p className="text-xs uppercase tracking-widest text-[#888888] font-bold mb-2">{label}</p>
        <p className={`text-3xl font-black ${color}`}>
            {value ?? <span className="text-[#333]">—</span>}{suffix}
        </p>
    </div>
);

const AdminPlacementDashboard = () => {
    const [stats, setStats]         = useState(null);
    const [driveStats, setDriveStats] = useState(null);
    const [prStats, setPRStats]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    useEffect(() => {
        Promise.all([
            API.get('/admin/stats'),
            API.get('/admin/drive-stats'),
            API.get('/admin/pr-stats'),
        ])
            .then(([statsRes, driveRes, prRes]) => {
                if (statsRes.data?.data)  setStats(statsRes.data.data);
                if (driveRes.data?.data)  setDriveStats(driveRes.data.data);
                if (prRes.data?.data)     setPRStats(prRes.data.data);
            })
            .catch(err => {
                console.error('Admin stats fetch failed:', err);
                setError('Failed to load dashboard stats. Make sure you are logged in as admin.');
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8 bg-[#F4EFE4] min-h-screen text-[#1B2A4A] w-full">
            <h1 className="text-[#1B2A4A] mb-2 text-3xl font-black tracking-tight">Placement Admin Dashboard</h1>
            <p className="text-[#888888] text-sm mb-8">Platform-wide placement analytics and management.</p>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {error && !loading && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Core KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-full max-w-6xl">
                        <StatCard
                            label="Total Students"
                            value={stats?.total_students}
                            color="text-[#1B2A4A]"
                        />
                        <StatCard
                            label="Placed Students"
                            value={stats?.placed_students}
                            color="text-[#34D399]"
                        />
                        <StatCard
                            label="Placement Rate"
                            value={stats?.placement_rate}
                            color="text-[#818CF8]"
                            suffix="%"
                        />
                    </div>

                    {/* Drive + PR KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 w-full max-w-6xl">
                        <StatCard
                            label="Avg Apps / Drive"
                            value={driveStats?.applications_per_drive}
                            color="text-[#1B2A4A]"
                        />
                        <StatCard
                            label="Selection Rate"
                            value={driveStats?.selection_rate}
                            color="text-[#1B2A4A]"
                            suffix="%"
                        />
                        <StatCard
                            label="Students / PR"
                            value={prStats?.students_per_pr}
                            color="text-[#F59E0B]"
                        />
                        <StatCard
                            label="PR Success Rate"
                            value={prStats?.success_rate}
                            color="text-[#F59E0B]"
                            suffix="%"
                        />
                    </div>

                    {/* Management Sections */}
                    <div className="space-y-6 w-full max-w-6xl">
                        <section className="p-6 bg-[#08080A] border border-[#181818] rounded-[1.5rem]">
                            <h3 className="text-lg text-[#1B2A4A] font-black">PR Management</h3>
                            <p className="text-sm text-[#888888] mt-2">
                                Manage Placement Representatives and assign student batches.
                            </p>
                        </section>

                        <section className="p-6 bg-[#08080A] border border-[#181818] rounded-[1.5rem]">
                            <h3 className="text-lg text-[#1B2A4A] font-black">Drive Management</h3>
                            <p className="text-sm text-[#888888] mt-2">
                                Create and configure upcoming placement drives and their designated rounds.
                            </p>
                        </section>

                        <section className="p-6 bg-[#08080A] border border-[#181818] rounded-[1.5rem]">
                            <h3 className="text-lg text-[#1B2A4A] font-black">Application &amp; Round Overview</h3>
                            <p className="text-sm text-[#888888] mt-2">
                                Check drive applications globally and view round progress statistics.
                            </p>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminPlacementDashboard;
