import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Search, Calendar, Users, ChevronRight, CheckSquare, Square, Zap } from 'lucide-react';

export default function PlacementAdminDashboard() {
    const [drives, setDrives] = useState([]);
    const [selectedDriveId, setSelectedDriveId] = useState(null);
    const [driveDetails, setDriveDetails] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loadingDrives, setLoadingDrives] = useState(true);
    const [loadingApps, setLoadingApps] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApps, setSelectedApps] = useState([]);
    const [bulkRoundId, setBulkRoundId] = useState('');
    const [rowRoundIds, setRowRoundIds] = useState({});

    // Fetch drives on mount
    useEffect(() => {
        API.get('/drive/all')
            .then(res => setDrives(res.data.data))
            .catch(() => setDrives([]))
            .finally(() => setLoadingDrives(false));
    }, []);

    // Fetch applications when a drive is selected
    useEffect(() => {
        if (selectedDriveId) {
            setLoadingApps(true);
            Promise.all([
                API.get(`/application/drive/${selectedDriveId}`),
                API.get(`/drive/${selectedDriveId}`)
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
            }).finally(() => setLoadingApps(false));
        } else {
            setApplications([]);
            setDriveDetails(null);
        }
    }, [selectedDriveId]);

    const refreshApps = () => {
        if (!selectedDriveId) return;
        API.get(`/application/drive/${selectedDriveId}`).then(res => setApplications(res.data.data));
    };

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

    const filteredApps = applications.filter(app => {
        if (searchQuery && !app.student_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const toggleSelectAll = (e) => { if (e.target.checked) setSelectedApps(filteredApps.map(a => a.id)); else setSelectedApps([]); };
    const toggleSelectRow = (appId) => { if (selectedApps.includes(appId)) setSelectedApps(selectedApps.filter(id => id !== appId)); else setSelectedApps([...selectedApps, appId]); };

    const statusBadge = (status) => {
        const cls = status === 'Placed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-[#FF4D26]/10 text-primary-accent border-[#FF4D26]/20';
        return <span className={`font-bold px-2 py-1 rounded-md text-[10px] uppercase border ${cls}`}>{status}</span>;
    };

    return (
        <div className="flex h-[calc(100vh-160px)] gap-6 font-['Inter']">
            {/* LEFT PANE: Drive List */}
            <div className="w-1/3 min-w-[320px] max-w-[400px] flex flex-col h-full bg-[#FFFFFF] border border-[#E4DED0] rounded-[24px] overflow-hidden shadow-sm relative z-10">
                <div className="p-5 border-b border-[#E4DED0]">
                    <h2 className="text-xl font-black text-[#1B2A4A] tracking-tight">Active Drives</h2>
                    <p className="text-xs text-[#9A968A] mt-1">Select a drive to manage applications</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loadingDrives ? (
                        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" /></div>
                    ) : drives.length === 0 ? (
                        <p className="text-center text-sm text-[#9A968A] py-10">No drives found.</p>
                    ) : drives.map((drive) => (
                        <button 
                            key={drive.id}
                            onClick={() => setSelectedDriveId(drive.id)}
                            className={`w-full text-left p-4 rounded-[16px] transition-all border ${selectedDriveId === drive.id ? 'bg-[#1B2A4A]/5 border-[#1B2A4A]/20' : 'bg-transparent border-transparent hover:bg-[#1B2A4A]/[0.02] hover:border-[#E4DED0]'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-black text-sm text-[#1B2A4A]">{drive.company_name}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A968A]">{drive.role}</p>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase font-black border ${drive.status === 'open' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                    {drive.status}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E4DED0]/50">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B6B63]">
                                    <Users size={12} className="text-[#1B2A4A]" /> {drive.application_count || 0} Apps
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B6B63]">
                                    <Calendar size={12} className="text-[#1B2A4A]" /> {new Date(drive.deadline).toLocaleDateString()}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE: Drive Details & Applicant List */}
            <div className="flex-1 flex flex-col h-full bg-[#FFFFFF] border border-[#E4DED0] rounded-[24px] overflow-hidden shadow-sm relative z-10">
                {!selectedDriveId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#9A968A]">
                        <div className="w-16 h-16 rounded-full bg-[#F4EFE4] flex items-center justify-center mb-4">
                            <ChevronRight size={24} className="text-[#1B2A4A]/30" />
                        </div>
                        <p className="font-bold">Select a drive to view details</p>
                    </div>
                ) : loadingApps ? (
                    <div className="flex-1 flex justify-center items-center"><div className="w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <>
                        {/* Header Area */}
                        <div className="p-6 border-b border-[#E4DED0] bg-[#F4EFE4]/30 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#1B2A4A]/5 to-transparent pointer-events-none rounded-bl-full" />
                            <h2 className="text-2xl font-black text-[#1B2A4A] tracking-tight">{driveDetails?.company_name}</h2>
                            <p className="text-sm text-[#6B6B63] font-medium">{driveDetails?.role} • Round Management</p>
                            
                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E4DED0] shadow-sm flex-1 max-w-md">
                                    <Search size={16} className="text-[#9A968A]" />
                                    <input 
                                        type="text" placeholder="Search applicants..." 
                                        className="bg-transparent border-none outline-none text-sm text-[#1B2A4A] w-full"
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                {/* Bulk Action Bar (Internal to Header) */}
                                <AnimatePresence>
                                    {selectedApps.length > 0 && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex items-center gap-3 bg-[#1B2A4A] text-white px-4 py-2 rounded-xl shadow-md">
                                            <span className="text-xs font-bold whitespace-nowrap">{selectedApps.length} Selected</span>
                                            <div className="w-px h-4 bg-white/20" />
                                            <select className="bg-white/10 border border-white/20 p-1.5 rounded-lg text-xs outline-none min-w-[120px]"
                                                value={bulkRoundId} onChange={e => setBulkRoundId(e.target.value)}>
                                                <option value="" className="text-black">Select Round...</option>
                                                {driveDetails?.rounds?.map(r => <option key={r.id} value={r.id} className="text-black">{r.round_name}</option>)}
                                            </select>
                                            <button onClick={() => handleBulkUpdate('Pass')} className="bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors">Pass</button>
                                            <button onClick={() => handleBulkUpdate('Fail')} className="bg-red-500 hover:bg-red-400 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors">Fail</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Applicant Table */}
                        <div className="flex-1 overflow-auto bg-white">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                    <tr className="border-b border-[#E4DED0]">
                                        <th className="px-5 py-4 w-10">
                                            <button onClick={toggleSelectAll} className="text-[#9A968A] hover:text-[#1B2A4A]">
                                                {selectedApps.length === filteredApps.length && filteredApps.length > 0 ? <CheckSquare size={16} className="text-[#1B2A4A]" /> : <Square size={16} />}
                                            </button>
                                        </th>
                                        <th className="px-5 py-4 font-black uppercase tracking-widest text-[10px] text-[#9A968A]">Candidate</th>
                                        <th className="px-5 py-4 font-black uppercase tracking-widest text-[10px] text-[#9A968A] text-center">AI Match Score</th>
                                        <th className="px-5 py-4 font-black uppercase tracking-widest text-[10px] text-[#9A968A]">Status / Round</th>
                                        <th className="px-5 py-4 font-black uppercase tracking-widest text-[10px] text-[#9A968A] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E4DED0]">
                                    {filteredApps.length === 0 ? (
                                        <tr><td colSpan="5" className="px-5 py-20 text-center text-[#9A968A] font-medium">No applicants found.</td></tr>
                                    ) : filteredApps.map((app, idx) => (
                                        <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                            className={`hover:bg-[#F4EFE4]/30 transition-colors ${selectedApps.includes(app.id) ? 'bg-[#1B2A4A]/[0.02]' : ''}`}>
                                            <td className="px-5 py-4">
                                                <button onClick={() => toggleSelectRow(app.id)} className="text-[#9A968A] hover:text-[#1B2A4A]">
                                                    {selectedApps.includes(app.id) ? <CheckSquare size={16} className="text-[#1B2A4A]" /> : <Square size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-[#1B2A4A]">{app.student_name}</p>
                                                <p className="text-[11px] text-[#9A968A] mt-0.5">Batch: {app.student_batch}</p>
                                            </td>
                                            <td className="px-5 py-4 align-middle">
                                                {/* Mini AI Match Score Visual */}
                                                <div className="flex justify-center">
                                                    {app.ai_match_score ? (
                                                        <div className="flex items-center gap-3 bg-[#F4EFE4]/50 border border-[#E4DED0] px-3 py-1.5 rounded-full">
                                                            <div className="relative w-8 h-8 flex items-center justify-center">
                                                                <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90">
                                                                    <circle cx="16" cy="16" r="14" fill="none" stroke="#E4DED0" strokeWidth="4" />
                                                                    <circle cx="16" cy="16" r="14" fill="none" stroke={app.ai_match_score >= 75 ? '#16A34A' : app.ai_match_score >= 50 ? '#1B2A4A' : '#DC2626'} strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={(2 * Math.PI * 14) * (1 - app.ai_match_score / 100)} />
                                                                </svg>
                                                                <span className="absolute text-[10px] font-black text-[#1B2A4A]">{app.ai_match_score}</span>
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-[#9A968A]">Match</span>
                                                                <span className={`text-[10px] font-bold ${app.ai_match_score >= 75 ? 'text-green-600' : app.ai_match_score >= 50 ? 'text-[#1B2A4A]' : 'text-red-600'}`}>
                                                                    {app.ai_match_score >= 75 ? 'High' : app.ai_match_score >= 50 ? 'Med' : 'Low'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-[#9A968A] italic px-3 py-1.5 bg-[#F4EFE4]/50 rounded-full border border-[#E4DED0]">Not Analyzed</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    {statusBadge(app.status)}
                                                    <span className="text-[11px] font-bold text-[#6B6B63]">R{app.current_round}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end items-center gap-2">
                                                    {(app.status === 'Applied' || app.status === 'In Progress') ? (
                                                        <div className="flex items-center gap-2 bg-[#F4EFE4]/50 border border-[#E4DED0] p-1.5 rounded-xl">
                                                            <select className="bg-white border border-[#E4DED0] px-2 py-1.5 rounded-lg text-xs font-medium text-[#1B2A4A] outline-none min-w-[100px]"
                                                                value={rowRoundIds[app.id] || ''} onChange={e => setRowRoundIds({...rowRoundIds, [app.id]: e.target.value})}>
                                                                <option value="">Select Round</option>
                                                                {driveDetails?.rounds?.map(r => <option key={r.id} value={r.id}>{r.round_name}</option>)}
                                                            </select>
                                                            <button onClick={() => handleUpdateRound(app.id, 'Pass')} className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-black transition-colors border border-green-200">Pass</button>
                                                            <button onClick={() => handleUpdateRound(app.id, 'Fail')} className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-black transition-colors border border-red-200">Fail</button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[#9A968A] font-bold text-[10px] uppercase tracking-widest px-4 py-2 bg-[#F4EFE4]/50 border border-[#E4DED0] rounded-xl">Locked</span>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
