import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../services/api';
import { useAppContext } from '../context/AppContext';
import { 
    LayoutDashboard, Briefcase, Users, FileText, CheckCircle, 
    Plus, ChevronRight, Search, Filter, ArrowLeft, MoreHorizontal,
    TrendingUp, Award, Clock, Mail, Phone, ExternalLink, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

const StatCard = ({ label, value, color = 'text-white', suffix = '', icon }) => (
    <div className="bg-[#08080A] border border-[#181818] rounded-2xl p-5 shadow-[0_0_20px_rgba(249,115,22,0.02)] flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold">{label}</p>
            <div className="p-2 bg-[#F97316]/10 rounded-lg text-[#F97316]">
                {icon}
            </div>
        </div>
        <p className={`text-2xl font-black ${color}`}>
            {value ?? '—'}{suffix}
        </p>
    </div>
);

// --- Sub-Pages ---

const DashboardStats = () => {
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
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Students" value={stats?.total_students} icon={<Users size={16} />} />
                <StatCard label="Placed Rate" value={stats?.placement_rate} suffix="%" color="text-[#34D399]" icon={<Award size={16} />} />
                <StatCard label="Apps / Drive" value={driveStats?.applications_per_drive} color="text-[#F97316]" icon={<FileText size={16} />} />
                <StatCard label="Selection Rate" value={driveStats?.selection_rate} suffix="%" color="text-[#818CF8]" icon={<CheckCircle size={16} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#08080A] border border-[#181818] rounded-3xl p-6">
                    <h3 className="text-lg font-black mb-4">Batch Performance</h3>
                    <div className="space-y-4">
                        {['2024', '2025', '2026'].map(batch => (
                            <div key={batch} className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                                <span className="text-sm font-bold">Class of {batch}</span>
                                <span className="text-xs text-[#F97316] font-black">82% Prepared</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[#08080A] border border-[#181818] rounded-3xl p-6">
                    <h3 className="text-lg font-black mb-4">Upcoming Deadlines</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-[#F97316]/5 border border-[#F97316]/20 rounded-xl flex items-center gap-4">
                            <Clock size={16} className="text-[#F97316]" />
                            <div>
                                <p className="text-sm font-bold">Google - Software Engineer</p>
                                <p className="text-[10px] text-[#555]">Deadline: 2 days left</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DrivesManagement = () => {
    const [drives, setDrives] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ company_name: '', role: '', description: '', eligibility_criteria: '', deadline: '' });

    const fetchDrives = () => {
        setLoading(true);
        API.get('/drive/all').then(res => setDrives(res.data.data)).finally(() => setLoading(false));
    };

    useEffect(() => { fetchDrives(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure deadline has a time component if only a date was picked
            const submissionForm = { ...form };
            if (submissionForm.deadline && !submissionForm.deadline.includes('T')) {
                let formattedDate = submissionForm.deadline;
                
                // If it's DD-MM-YYYY, flip it to YYYY-MM-DD
                if (/^\d{2}-\d{2}-\d{4}$/.test(formattedDate)) {
                    const [d, m, y] = formattedDate.split('-');
                    formattedDate = `${y}-${m}-${d}`;
                }
                
                // Final check for YYYY-MM-DD
                if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
                    throw new Error("Invalid date format. Please use YYYY-MM-DD or use the date picker.");
                }
                
                submissionForm.deadline = `${formattedDate}T23:59:59`;
            }

            await API.post('/drive/create', submissionForm);
            setShowForm(false);
            setForm({ company_name: '', role: '', description: '', eligibility_criteria: '', deadline: '' });
            fetchDrives();
        } catch (err) {
            console.error("Failed to create drive:", err);
            const msg = err.response?.data?.detail || err.message || "Failed to launch drive. Please check your inputs.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black">Placement Drives</h2>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                >
                    <Plus size={16} /> Create New Drive
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleCreate} className="bg-[#08080A] border border-[#181818] rounded-3xl p-6 space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Company Name" className="bg-[#050505] border border-[#1A1A1A] p-3 rounded-xl text-sm focus:border-[#F97316] outline-none" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} required />
                                <input placeholder="Job Role" className="bg-[#050505] border border-[#1A1A1A] p-3 rounded-xl text-sm focus:border-[#F97316] outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})} required />
                            </div>
                            <textarea placeholder="Description" className="w-full bg-[#050505] border border-[#1A1A1A] p-3 rounded-xl text-sm focus:border-[#F97316] outline-none h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Eligibility Criteria" className="bg-[#050505] border border-[#1A1A1A] p-3 rounded-xl text-sm focus:border-[#F97316] outline-none" value={form.eligibility_criteria} onChange={e => setForm({...form, eligibility_criteria: e.target.value})} required />
                                <input type="date" className="bg-[#050505] border border-[#1A1A1A] p-3 rounded-xl text-sm focus:border-[#F97316] outline-none text-white" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-[#F97316] text-white py-3 rounded-xl font-bold disabled:opacity-50">
                                {loading ? 'Launching...' : 'Launch Drive'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {drives.map(drive => (
                    <div key={drive.id} className="bg-[#08080A] border border-[#181818] rounded-2xl p-5 hover:border-[#F97316]/30 transition-all group">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-black text-lg">{drive.company_name}</h3>
                            <span className="text-[10px] px-2 py-1 bg-[#F97316]/10 text-[#F97316] rounded-md uppercase font-black">{drive.status}</span>
                        </div>
                        <p className="text-xs text-[#555] mb-4 font-bold">{drive.role}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-[#141414]">
                            <span className="text-[10px] text-[#444]">Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
                            <Link to={`/admin/applications?drive=${drive.id}`} className="text-[#F97316] text-xs font-bold flex items-center gap-1 hover:underline">
                                View Applicants <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StudentsBatchView = () => {
    const [batches] = useState(['2024', '2025', '2026']);
    const [selectedBatch, setSelectedBatch] = useState('2026');
    const [drives, setDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        API.get('/drive/all').then(res => {
            setDrives(res.data.data);
            if (res.data.data.length > 0) setSelectedDrive(res.data.data[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedDrive && selectedBatch) {
            setLoading(true);
            API.get(`/admin/drive/${selectedDrive}/batch-status?batch=${selectedBatch}`)
                .then(res => setStudents(res.data.data))
                .finally(() => setLoading(false));
        }
    }, [selectedDrive, selectedBatch]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div>
                    <h2 className="text-xl font-black">Batch Tracking</h2>
                    <p className="text-xs text-[#555]">Check student application status for specific drives.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        className="bg-[#08080A] border border-[#181818] p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#F97316]"
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                    >
                        {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                    </select>
                    <select 
                        className="bg-[#08080A] border border-[#181818] p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#F97316]"
                        value={selectedDrive}
                        onChange={e => setSelectedDrive(e.target.value)}
                    >
                        {drives.map(d => <option key={d.id} value={d.id}>{d.company_name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-[#08080A] border border-[#181818] rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-[#141414] bg-white/2">
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Student</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {loading ? (
                            <tr><td colSpan="3" className="px-6 py-20 text-center text-[#555]">Syncing batch status...</td></tr>
                        ) : students.map(s => (
                            <tr key={s.id} className="hover:bg-white/1 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-white">{s.name}</p>
                                    <p className="text-[10px] text-[#444]">{s.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-[#555]">
                                        <Mail size={14} className="hover:text-white cursor-pointer" />
                                        <Phone size={14} className="hover:text-white cursor-pointer" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${s.applied ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                        <span className={`font-black ${s.applied ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                                            {s.applied ? 'Applied' : 'Not Applied'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ApplicationsManagement = () => {
    const location = useLocation();
    const [selectedDrive, setSelectedDrive] = useState(new URLSearchParams(location.search).get('drive') || '');
    const [drives, setDrives] = useState([]);
    const [driveDetails, setDriveDetails] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Enhanced UI State
    const [filters, setFilters] = useState({ search: '', status: '', batch: '', round: '' });
    const [selectedApps, setSelectedApps] = useState([]);
    const [bulkRoundId, setBulkRoundId] = useState('');
    const [rowRoundIds, setRowRoundIds] = useState({});
    const [studentModalId, setStudentModalId] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);

    useEffect(() => {
        API.get('/drive/s').then(res => setDrives(res.data.data));
    }, []);

    useEffect(() => {
        if (selectedDrive) {
            setLoading(true);
            Promise.all([
                API.get(`/application/drive/${selectedDrive}`),
                API.get(`/drive/${selectedDrive}`)
            ]).then(([appsRes, driveRes]) => {
                setApplications(appsRes.data.data);
                setDriveDetails(driveRes.data.data);
                
                // Default round selectors to the current round
                const initialRowRounds = {};
                appsRes.data.data.forEach(app => {
                    const currentRoundData = driveRes.data.data.rounds.find(r => r.round_number === app.current_round);
                    if (currentRoundData) initialRowRounds[app.id] = currentRoundData.id;
                });
                setRowRoundIds(initialRowRounds);
                setSelectedApps([]); // reset selection
            }).finally(() => setLoading(false));
        } else {
            setApplications([]);
            setDriveDetails(null);
        }
    }, [selectedDrive]);

    useEffect(() => {
        if (studentModalId) {
            API.get(`/application/student/${studentModalId}`)
                .then(res => setStudentProfile(res.data.data))
                .catch(() => alert("Failed to load student profile"));
        } else {
            setStudentProfile(null);
        }
    }, [studentModalId]);

    const refreshApps = () => {
        API.get(`/application/drive/${selectedDrive}`).then(res => setApplications(res.data.data));
    };

    const handleUpdateRound = (appId, status) => {
        const roundId = rowRoundIds[appId];
        if (!roundId) return alert("Please select a round");
        const roundObj = driveDetails?.rounds.find(r => r.id == roundId);
        
        API.post('/application/update-round', { 
            application_id: appId, 
            round_id: roundId, 
            round_number: roundObj?.round_number,
            status 
        }).then(() => refreshApps())
          .catch(err => alert(err.response?.data?.detail || "Update failed"));
    };

    const handleBulkUpdate = (status) => {
        if (!bulkRoundId) return alert("Please select a round for bulk update");
        const roundObj = driveDetails?.rounds.find(r => r.id == bulkRoundId);
        
        API.post('/application/bulk-update', {
            application_ids: selectedApps,
            round_id: bulkRoundId,
            round_number: roundObj?.round_number,
            status
        }).then(() => {
            setSelectedApps([]);
            refreshApps();
        }).catch(err => alert(err.response?.data?.detail || "Bulk update failed"));
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

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedApps(filteredApps.map(a => a.id));
        else setSelectedApps([]);
    };
    
    const toggleSelectRow = (appId) => {
        if (selectedApps.includes(appId)) setSelectedApps(selectedApps.filter(id => id !== appId));
        else setSelectedApps([...selectedApps, appId]);
    };

    // Extract unique batches for the filter dropdown
    const uniqueBatches = [...new Set(applications.map(a => a.student_batch))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div>
                    <h2 className="text-xl font-black">Application Management</h2>
                    <p className="text-xs text-[#555]">Manage applicants, update round results, and export data.</p>
                </div>
                <div className="flex gap-2">
                    {selectedDrive && (
                        <button 
                            onClick={handleExportCSV}
                            className="bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    )}
                    <select 
                        className="bg-[#08080A] border border-[#181818] p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#F97316] min-w-[200px]"
                        value={selectedDrive}
                        onChange={e => setSelectedDrive(e.target.value)}
                    >
                        <option value="">Select a Drive</option>
                        {drives.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.company_name} ({d.application_count || 0} applications)
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filter Bar */}
            {selectedDrive && !loading && (
                <div className="flex flex-col md:flex-row gap-3 bg-[#08080A] border border-[#181818] p-4 rounded-2xl items-center">
                    <div className="flex items-center gap-2 bg-[#050505] border border-[#1A1A1A] rounded-xl px-3 flex-1 w-full">
                        <Search size={14} className="text-[#555]" />
                        <input 
                            type="text" 
                            placeholder="Search by student name..." 
                            className="bg-transparent border-none outline-none text-xs text-white p-2.5 w-full"
                            value={filters.search}
                            onChange={e => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <select className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-auto"
                        value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})}>
                        <option value="">All Batches</option>
                        {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-auto"
                        value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                        <option value="">All Statuses</option>
                        <option value="Applied">Applied</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Placed">Placed</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <select className="bg-[#050505] border border-[#1A1A1A] p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-auto"
                        value={filters.round} onChange={e => setFilters({...filters, round: e.target.value})}>
                        <option value="">All Rounds</option>
                        {driveDetails?.rounds?.map(r => (
                            <option key={r.id} value={r.round_number}>Round {r.round_number}: {r.round_name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedApps.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-[#F97316]/10 border border-[#F97316]/30 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                        <div className="text-sm font-bold text-[#F97316] flex items-center gap-2">
                            <CheckCircle size={16} /> {selectedApps.length} students selected
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select 
                                className="bg-[#050505] border border-[#F97316]/30 p-2 rounded-lg text-xs text-white outline-none flex-1 sm:w-48"
                                value={bulkRoundId}
                                onChange={e => setBulkRoundId(e.target.value)}
                            >
                                <option value="">Select Round...</option>
                                {driveDetails?.rounds?.map(r => (
                                    <option key={r.id} value={r.id}>{r.round_name}</option>
                                ))}
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
                        <tr className="border-b border-[#141414] bg-white/2">
                            <th className="px-6 py-4 w-10">
                                <input type="checkbox" className="accent-[#F97316]" 
                                    checked={selectedApps.length === filteredApps.length && filteredApps.length > 0} 
                                    onChange={toggleSelectAll} 
                                    disabled={!selectedDrive || filteredApps.length === 0} />
                            </th>
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
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-[#555]">Loading applications...</td></tr>
                        ) : filteredApps.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-[#555]">No applications match the filters.</td></tr>
                        ) : filteredApps.map(app => (
                            <tr key={app.id} className={`hover:bg-white/1 transition-colors ${selectedApps.includes(app.id) ? 'bg-white/5' : ''}`}>
                                <td className="px-6 py-4">
                                    <input type="checkbox" className="accent-[#F97316]" 
                                        checked={selectedApps.includes(app.id)} 
                                        onChange={() => toggleSelectRow(app.id)} />
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setStudentModalId(app.student_id)} className="text-left group">
                                        <p className="font-bold text-white group-hover:text-[#F97316] transition-colors">{app.student_name}</p>
                                        <p className="text-[10px] text-[#555]">Batch: {app.student_batch}</p>
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    {app.resume_url ? (
                                        <a href={app.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#F97316] font-bold hover:underline w-fit">
                                            <FileText size={14} /> View
                                        </a>
                                    ) : <span className="text-[#444]">N/A</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold px-2 py-1 rounded-md text-[10px] uppercase ${
                                        app.status === 'Placed' ? 'bg-green-500/10 text-green-400' : 
                                        app.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 
                                        'bg-[#F97316]/10 text-[#F97316]'
                                    }`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-[#888]">
                                    Round {app.current_round}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {(app.status === 'Applied' || app.status === 'In Progress') ? (
                                            <>
                                                <select 
                                                    className="bg-[#050505] border border-[#222] p-1.5 rounded-lg text-xs text-white outline-none min-w-[120px]"
                                                    value={rowRoundIds[app.id] || ''}
                                                    onChange={e => setRowRoundIds({...rowRoundIds, [app.id]: e.target.value})}
                                                >
                                                    <option value="">Select Round</option>
                                                    {driveDetails?.rounds?.map(r => (
                                                        <option key={r.id} value={r.id}>{r.round_name}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleUpdateRound(app.id, 'Pass')} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg font-black border border-green-500/20">Pass</button>
                                                <button onClick={() => handleUpdateRound(app.id, 'Fail')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-black border border-red-500/20">Fail</button>
                                            </>
                                        ) : (
                                            <span className="text-[#444] font-bold text-[10px] uppercase tracking-widest">Locked</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Student Profile Modal */}
            <AnimatePresence>
                {studentModalId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0A0A0C] border border-[#181818] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-[#181818] flex justify-between items-center bg-[#050505]">
                                <div>
                                    <h3 className="text-xl font-black">{studentProfile ? studentProfile.name : 'Loading...'}</h3>
                                    <p className="text-[#555] text-xs font-bold">{studentProfile?.email} • Batch {studentProfile?.batch}</p>
                                </div>
                                <button onClick={() => setStudentModalId(null)} className="p-2 hover:bg-white/5 rounded-full text-[#555] hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {studentProfile ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-4">
                                                <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold mb-1">CGPA</p>
                                                <p className="text-xl font-black text-[#F97316]">{studentProfile.cgpa}</p>
                                            </div>
                                            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-4">
                                                <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold mb-1">Skills</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {studentProfile.profile_data?.skills?.slice(0,4).map(s => (
                                                        <span key={s} className="px-2 py-0.5 bg-white/5 text-[10px] font-bold rounded-md">{s}</span>
                                                    ))}
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
                                                            <div>
                                                                <p className="font-black text-sm">{app.company_name}</p>
                                                                <p className="text-[#555] text-xs font-bold">{app.role}</p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                                                                app.status === 'Placed' ? 'bg-green-500/10 text-green-400' :
                                                                app.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                                                                'bg-[#F97316]/10 text-[#F97316]'
                                                            }`}>{app.status}</span>
                                                        </div>

                                                        <div className="relative pl-4 border-l border-[#222] space-y-4">
                                                            {app.rounds.map((r, i) => (
                                                                <div key={r.round_id} className="relative">
                                                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#050505] ${
                                                                        r.status === 'Pass' ? 'bg-green-500' :
                                                                        r.status === 'Fail' ? 'bg-red-500' :
                                                                        'bg-[#F97316]'
                                                                    }`} />
                                                                    <p className="text-xs font-bold">{r.round_name}</p>
                                                                    <p className="text-[10px] text-[#555] uppercase font-black">{r.status}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Layout ---

export default function AdminDashboard() {
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
        { name: 'Manage Drives', path: '/admin/drives', icon: <Briefcase size={18} /> },
        { name: 'Student Batch', path: '/admin/students', icon: <Users size={18} /> },
        { name: 'Applications', path: '/admin/applications', icon: <FileText size={18} /> },
    ];

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-[#060606] text-white overflow-hidden font-['Inter']">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-[#141414] bg-[#080808] flex flex-col p-6">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                        A
                    </div>
                    <div>
                        <h1 className="font-black text-sm tracking-tight">Admin Panel</h1>
                        <p className="text-[10px] text-[#444] font-bold">PLACEMENT INTEL</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map(item => (
                        <Link 
                            key={item.name} 
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
                                ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'
                                : 'text-[#555] hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="pt-6 border-t border-[#141414]">
                    <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-white/2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#F59E0B] flex items-center justify-center font-black text-xs">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-black truncate">{user?.name}</p>
                            <p className="text-[10px] text-[#444] font-bold">Super Admin</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-[#555] hover:text-red-400 transition-colors text-sm font-bold w-full">
                        <MoreHorizontal size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-10 relative">
                <div className="absolute top-0 right-0 p-10 pointer-events-none">
                    <div className="w-96 h-96 bg-[#F97316]/5 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <Routes>
                        <Route path="/" element={<DashboardStats />} />
                        <Route path="/drives" element={<DrivesManagement />} />
                        <Route path="/students" element={<StudentsBatchView />} />
                        <Route path="/applications" element={<ApplicationsManagement />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
