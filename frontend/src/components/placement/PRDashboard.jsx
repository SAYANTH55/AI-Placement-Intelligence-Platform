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
        <div className="p-8 bg-[#F4EFE4] min-h-screen text-[#1B2A4A] w-full">
            <h1 className="text-[#1B2A4A] mb-2 text-3xl font-black tracking-tight">My PR Dashboard</h1>
            <p className="text-[#888888] text-sm mb-8">
                Welcome back, <span className="text-[#1B2A4A] font-bold">{user?.name}</span>. Manage your assigned batch below.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
                <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(27,42,74,0.03)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-[#1B2A4A]">My Assigned Batch</h3>
                        {!loading && !error && (
                            <span className="text-xs font-black px-3 py-1 rounded-full bg-[#1B2A4A]/10 border border-[#1B2A4A]/20 text-[#1B2A4A]">
                                {assignedStudents.length} Students
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[#888888] mb-4">
                        View performance insights and progression metrics for your assigned students.
                    </p>

                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" />
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
                                    className="p-3 bg-black/40 border border-[#C9C2AF] rounded-xl flex justify-between items-center hover:border-[#1B2A4A]/20 transition-colors"
                                >
                                    <div>
                                        <span className="text-sm font-bold text-[#1B2A4A]">{s.name}</span>
                                        <p className="text-[10px] text-[#888888] mt-0.5">{s.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-[#1B2A4A]">CGPA {s.cgpa}</span>
                                        <p className="text-[10px] text-[#888888] mt-0.5">Batch {s.batch}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-[#888888] py-6 text-center">No students assigned yet.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(27,42,74,0.03)]">
                    <h3 className="text-lg font-black mb-2 text-[#1B2A4A]">Drive Applications</h3>
                    <p className="text-sm text-[#888888]">
                        Track the current application statuses and manage round feedback (Pass/Fail) for your batch.
                    </p>
                    <div className="mt-6 flex items-center justify-center py-8 border border-dashed border-[#C9C2AF] rounded-xl">
                        <p className="text-xs text-[#333]">Application tracking — coming soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PRDashboard;
