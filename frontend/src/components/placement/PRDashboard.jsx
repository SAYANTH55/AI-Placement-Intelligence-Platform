import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAppContext } from '../../context/AppContext';

const PRDashboard = () => {
    const { user } = useAppContext();
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // pr_id is returned by the login endpoint for PR-role users
        const prId = user?.pr_id;
        if (!prId) {
            setError('PR profile ID not found. Please log out and log back in.');
            setLoading(false);
            return;
        }

        API.get(`/pr/${prId}/students`)
            .then(res => {
                if (res.data?.data) setAssignedStudents(res.data.data);
            })
            .catch(err => {
                console.error('PR fetch failed:', err);
                setError('Failed to load your assigned students. Please refresh.');
            })
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div className="p-8 bg-[#060606] min-h-screen text-white w-full">
            <h1 className="text-[#F97316] mb-2 text-3xl font-black tracking-tight">My PR Dashboard</h1>
            <p className="text-[#555] text-sm mb-8">
                Welcome back, <span className="text-white font-bold">{user?.name}</span>. Manage your assigned batch below.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
                <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(249,115,22,0.03)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">My Assigned Batch</h3>
                        {!loading && !error && (
                            <span className="text-xs font-black px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]">
                                {assignedStudents.length} Students
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[#555] mb-4">
                        View performance insights and progression metrics for your assigned students.
                    </p>

                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="space-y-3">
                            {assignedStudents.length > 0 ? assignedStudents.map((s, i) => (
                                <div
                                    key={s.id ?? i}
                                    className="p-3 bg-black/40 border border-[#1A1A1A] rounded-xl flex justify-between items-center hover:border-[#F97316]/20 transition-colors"
                                >
                                    <div>
                                        <span className="text-sm font-bold text-white">{s.name}</span>
                                        <p className="text-[10px] text-[#555] mt-0.5">{s.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-[#F97316]">CGPA {s.cgpa}</span>
                                        <p className="text-[10px] text-[#555] mt-0.5">Batch {s.batch}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-[#444] py-6 text-center">No students assigned yet.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(249,115,22,0.03)]">
                    <h3 className="text-lg font-black mb-2 text-white">Drive Applications</h3>
                    <p className="text-sm text-[#555]">
                        Track the current application statuses and manage round feedback (Pass/Fail) for your batch.
                    </p>
                    <div className="mt-6 flex items-center justify-center py-8 border border-dashed border-[#1A1A1A] rounded-xl">
                        <p className="text-xs text-[#333]">Application tracking — coming soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PRDashboard;
