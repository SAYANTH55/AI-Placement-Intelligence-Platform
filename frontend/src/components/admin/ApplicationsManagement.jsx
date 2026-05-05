import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../services/api';
import {
    Search, CheckCircle, FileText, Download, X, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApplicationsManagement() {
    const location = useLocation();
    const [selectedDrive, setSelectedDrive] = useState(new URLSearchParams(location.search).get('drive') || '');
    const [drives, setDrives] = useState([]);
    const [driveDetails, setDriveDetails] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', status: '', batch: '', round: '' });
    const [selectedApps, setSelectedApps] = useState([]);
    const [bulkRoundId, setBulkRoundId] = useState('');
    const [rowRoundIds, setRowRoundIds] = useState({});
    const [studentModalId, setStudentModalId] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);

    useEffect(() => { API.get('/drive/s').then(res => setDrives(res.data.data)); }, []);

    useEffect(() => {
        if (selectedDrive) {
            setLoading(true);
            Promise.all([
                API.get(`/application/drive/${selectedDrive}`),
                API.get(`/drive/${selectedDrive}`)
            ]).then(([appsRes, driveRes]) => {
                setApplications(appsRes.data.data);
                setDriveDetails(driveRes.data.data);
                const initialRowRounds = {};
                appsRes.data.data.forEach(app => {
                    const currentRoundData = driveRes.data.data.rounds.find(r => r.round_number === app.current_round);
                    if (currentRoundData) initialRowRounds[app.id] = currentRoundData.id;
                });
                setRowRoundIds(initialRowRounds);
                setSelectedApps([]);
            }).finally(() => setLoading(false));
        } else { setApplications([]); setDriveDetails(null); }
    }, [selectedDrive]);

    useEffect(() => {
        if (studentModalId) {
            API.get(`/application/student/${studentModalId}`)
                .then(res => setStudentProfile(res.data.data))
                .catch(() => alert("Failed to load student profile"));
        } else { setStudentProfile(null); }
    }, [studentModalId]);

    const refreshApps = () => { API.get(`/application/drive/${selectedDrive}`).then(res => setApplications(res.data.data)); };

    const handleUpdateRound = (appId, status) => {
        const roundId = rowRoundIds[appId];
        if (!roundId) return alert("Please select a round");
        const roundObj = driveDetails?.rounds.find(r => r.id == roundId);
        API.post('/application/update-round', { application_id: appId, round_id: roundId, round_number: roundObj?.round_number, status })
            .then(() => refreshApps()).catch(err => alert(err.response?.data?.detail || "Update failed"));
    };

    const handleBulkUpdate = (status) => {
        if (!bulkRoundId) return alert("Please select a round for bulk update");
        const roundObj = driveDetails?.rounds.find(r => r.id == bulkRoundId);
        API.post('/application/bulk-update', { application_ids: selectedApps, round_id: bulkRoundId, round_number: roundObj?.round_number, status })
            .then(() => { setSelectedApps([]); refreshApps(); }).catch(err => alert(err.response?.data?.detail || "Bulk update failed"));
    };

    const handleExportCSV = () => {
        if (!selectedDrive) return;
        window.open(`${API.defaults.baseURL}/application/drive/${selectedDrive}/export`, '_blank');
    };

    const filteredApps = applications.filter(app => {
        if (filters.search && !app.student_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.status && app.status !== filters.status && app.final_status !== filters.status) return false;
        if (filters.batch && app.student_batch !== filters.batch) return false;
        if (filters.round && app.current_round.toString() !== filters.round) return false;
        return true;
    });

    const toggleSelectAll = (e) => { if (e.target.checked) setSelectedApps(filteredApps.map(a => a.id)); else setSelectedApps([]); };
    const toggleSelectRow = (appId) => { if (selectedApps.includes(appId)) setSelectedApps(selectedApps.filter(id => id !== appId)); else setSelectedApps([...selectedApps, appId]); };
    const uniqueBatches = [...new Set(applications.map(a => a.student_batch))];

    const statusBadge = (status) => {
        const cls = status === 'Placed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
        return <span className={`font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase border ${cls}`}>{status}</span>;
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Application Management</h1>
                        <p className="text-xs text-[#555] mt-1">Manage applicants, update round results, and export data.</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedDrive && (
                            <button onClick={handleExportCSV} className="bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                <Download size={14} /> Export CSV
                            </button>
                        )}
                        <select className="bg-[#08080A] border border-[#181818] p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#F97316] min-w-[200px]"
                            value={selectedDrive} onChange={e => setSelectedDrive(e.target.value)}>
                            <option value="">Select a Drive</option>
                            {drives.map(d => <option key={d.id} value={d.id}>{d.company_name} ({d.application_count || 0} apps)</option>)}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Summary cards */}
            {selectedDrive && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', val: filteredApps.length, color: 'text-white' },
                        { label: 'In Progress', val: filteredApps.filter(a => a.status === 'In Progress' || a.status === 'Applied').length, color: 'text-[#F97316]' },
                        { label: 'Placed', val: filteredApps.filter(a => a.status === 'Placed').length, color: 'text-[#34D399]' },
                        { label: 'Rejected', val: filteredApps.filter(a => a.status === 'Rejected').length, color: 'text-[#EF4444]' },
                    ].map((s, i) => (
                        <div key={i} className="bg-[#08080A] border border-[#181818] rounded-xl p-4">
                            <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold">{s.label}</p>
                            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Filter Bar */}
            {selectedDrive && !loading && (
                <div className="flex flex-col md:flex-row gap-3 bg-[#08080A] border border-[#181818] p-4 rounded-2xl items-center">
                    <div className="flex items-center gap-2 bg-[#050505] border border-[#1A1A1A] rounded-xl px-3 flex-1 w-full">
                        <Search size={14} className="text-[#555]" />
                        <input type="text" placeholder="Search by student name..." className="bg-transparent border-none outline-none text-xs text-white p-2.5 w-full"
                            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                    </div>
                    <select className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-auto"
                        value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})}>
                        <option value="">All Batches</option>
                        {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-auto"
                        value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                        <option value="">All Statuses</option>
                        <option value="Applied">Applied</option><option value="In Progress">In Progress</option>
                        <option value="Placed">Placed</option><option value="Rejected">Rejected</option>
                    </select>
                    <select className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-auto"
                        value={filters.round} onChange={e => setFilters({...filters, round: e.target.value})}>
                        <option value="">All Rounds</option>
                        {driveDetails?.rounds?.map(r => <option key={r.id} value={r.round_number}>Round {r.round_number}: {r.round_name}</option>)}
                    </select>
                </div>
            )}

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedApps.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-[#F97316]/10 border border-[#F97316]/30 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-bold text-[#F97316] flex items-center gap-2">
                            <CheckCircle size={16} /> {selectedApps.length} students selected
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select className="bg-[#050505] border border-[#F97316]/30 p-2 rounded-lg text-xs text-white outline-none flex-1 sm:w-48"
                                value={bulkRoundId} onChange={e => setBulkRoundId(e.target.value)}>
                                <option value="">Select Round...</option>
                                {driveDetails?.rounds?.map(r => <option key={r.id} value={r.id}>{r.round_name}</option>)}
                            </select>
                            <button onClick={() => handleBulkUpdate('Pass')} className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-xs font-black border border-green-500/20 hover:bg-green-500/30">Pass</button>
                            <button onClick={() => handleBulkUpdate('Fail')} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-black border border-red-500/20 hover:bg-red-500/30">Fail</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="bg-[#08080A] border border-[#181818] rounded-3xl overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-[#141414] bg-[#0A0A0C]">
                            <th className="px-6 py-4 w-10"><input type="checkbox" className="accent-[#F97316]" checked={selectedApps.length === filteredApps.length && filteredApps.length > 0} onChange={toggleSelectAll} disabled={!selectedDrive || filteredApps.length === 0} /></th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Student</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Resume</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Status</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Current Round</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {!selectedDrive ? (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-[#444]">Please select a drive to view applications.</td></tr>
                        ) : loading ? (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-[#555]"><div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" /> Loading...</div></td></tr>
                        ) : filteredApps.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-[#555]">No applications match the filters.</td></tr>
                        ) : filteredApps.map((app, idx) => (
                            <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                                className={`hover:bg-white/[0.02] transition-colors ${selectedApps.includes(app.id) ? 'bg-[#F97316]/5' : ''}`}>
                                <td className="px-6 py-4"><input type="checkbox" className="accent-[#F97316]" checked={selectedApps.includes(app.id)} onChange={() => toggleSelectRow(app.id)} /></td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setStudentModalId(app.student_id)} className="text-left group">
                                        <p className="font-bold text-white group-hover:text-[#F97316] transition-colors">{app.student_name}</p>
                                        <p className="text-[10px] text-[#555]">Batch: {app.student_batch}</p>
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    {app.resume_url ? (
                                        <a href={app.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#F97316] font-bold hover:underline w-fit"><FileText size={14} /> View</a>
                                    ) : <span className="text-[#444]">N/A</span>}
                                </td>
                                <td className="px-6 py-4">{statusBadge(app.status)}</td>
                                <td className="px-6 py-4 font-bold text-[#888]">Round {app.current_round}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {(app.status === 'Applied' || app.status === 'In Progress') ? (<>
                                            <select className="bg-[#050505] border border-[#222] p-1.5 rounded-lg text-xs text-white outline-none min-w-[120px]"
                                                value={rowRoundIds[app.id] || ''} onChange={e => setRowRoundIds({...rowRoundIds, [app.id]: e.target.value})}>
                                                <option value="">Select Round</option>
                                                {driveDetails?.rounds?.map(r => <option key={r.id} value={r.id}>{r.round_name}</option>)}
                                            </select>
                                            <button onClick={() => handleUpdateRound(app.id, 'Pass')} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg font-black border border-green-500/20">Pass</button>
                                            <button onClick={() => handleUpdateRound(app.id, 'Fail')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-black border border-red-500/20">Fail</button>
                                        </>) : <span className="text-[#444] font-bold text-[10px] uppercase tracking-widest">Locked</span>}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Student Profile Modal */}
            <AnimatePresence>
                {studentModalId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0A0A0C] border border-[#181818] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-[#181818] flex justify-between items-center bg-[#050505]">
                                <div>
                                    <h3 className="text-xl font-black">{studentProfile ? studentProfile.name : 'Loading...'}</h3>
                                    <p className="text-[#555] text-xs font-bold">{studentProfile?.email} • Batch {studentProfile?.batch}</p>
                                </div>
                                <button onClick={() => setStudentModalId(null)} className="p-2 hover:bg-white/5 rounded-full text-[#555] hover:text-white transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {studentProfile ? (<>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-4">
                                            <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold mb-1">CGPA</p>
                                            <p className="text-xl font-black text-[#F97316]">{studentProfile.cgpa}</p>
                                        </div>
                                        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-4">
                                            <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold mb-1">Skills</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {studentProfile.profile_data?.skills?.slice(0,4).map(s => <span key={s} className="px-2 py-0.5 bg-white/5 text-[10px] font-bold rounded-md">{s}</span>)}
                                                {(studentProfile.profile_data?.skills?.length || 0) > 4 && <span className="px-2 py-0.5 bg-white/5 text-[10px] font-bold rounded-md">+{studentProfile.profile_data.skills.length - 4}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-[#888] uppercase tracking-widest mb-4">Application History</h4>
                                        <div className="space-y-4">
                                            {studentProfile.applications.map(app => (
                                                <div key={app.application_id} className="border border-[#1A1A1A] rounded-2xl p-4 bg-[#050505]">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div><p className="font-black text-sm">{app.company_name}</p><p className="text-[#555] text-xs font-bold">{app.role}</p></div>
                                                        {statusBadge(app.status)}
                                                    </div>
                                                    <div className="relative pl-4 border-l border-[#222] space-y-4">
                                                        {app.rounds.map(r => (
                                                            <div key={r.round_id} className="relative">
                                                                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#050505] ${r.status === 'Pass' ? 'bg-green-500' : r.status === 'Fail' ? 'bg-red-500' : 'bg-[#F97316]'}`} />
                                                                <p className="text-xs font-bold">{r.round_name}</p>
                                                                <p className="text-[10px] text-[#555] uppercase font-black">{r.status}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>) : (
                                    <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" /></div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
