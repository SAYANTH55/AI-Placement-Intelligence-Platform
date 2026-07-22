import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Users, Mail, Phone, GraduationCap, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentsBatchView() {
    const [batches] = useState(['2024', '2025', '2026']);
    const [selectedBatch, setSelectedBatch] = useState('2026');
    const [drives, setDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

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
                .catch(() => setStudents([]))
                .finally(() => setLoading(false));
        }
    }, [selectedDrive, selectedBatch]);

    const filtered = students.filter(s =>
        !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const appliedCount = filtered.filter(s => s.applied).length;
    const notAppliedCount = filtered.filter(s => !s.applied).length;

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#1B2A4A]">Student Batches</h1>
                        <p className="text-xs text-secondary-muted mt-1">Track student application status across placement drives</p>
                    </div>
                    <div className="flex gap-2">
                        <select className="glass-search p-2.5 rounded-xl text-xs text-[#1B2A4A] outline-none focus:border-primary-accent"
                            value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                            {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                        </select>
                        <select className="glass-search p-2.5 rounded-xl text-xs text-[#1B2A4A] outline-none focus:border-primary-accent"
                            value={selectedDrive} onChange={e => setSelectedDrive(e.target.value)}>
                            {drives.map(d => <option key={d.id} value={d.id}>{d.company_name}</option>)}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Batch summary cards */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel shadow-card-depth rounded-2xl p-5 border-l-2 border-l-white/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 rounded-lg"><Users size={16} className="text-[#1B2A4A]" /></div>
                        <p className="text-[10px] uppercase tracking-widest text-secondary-muted font-bold">Total Students</p>
                    </div>
                    <p className="text-2xl font-black text-[#1B2A4A]">{filtered.length}</p>
                </div>
                <div className="glass-panel shadow-card-depth rounded-2xl p-5 border-l-2 border-l-primary-accent">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary-accent/10 border border-primary-accent/20 rounded-lg"><GraduationCap size={16} className="text-primary-accent" /></div>
                        <p className="text-[10px] uppercase tracking-widest text-secondary-muted font-bold">Applied</p>
                    </div>
                    <p className="text-2xl font-black text-primary-accent">{appliedCount}</p>
                </div>
                <div className="glass-panel shadow-card-depth rounded-2xl p-5 border-l-2 border-l-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 rounded-lg"><Users size={16} className="text-tertiary-muted" /></div>
                        <p className="text-[10px] uppercase tracking-widest text-secondary-muted font-bold">Not Applied</p>
                    </div>
                    <p className="text-2xl font-black text-tertiary-muted">{notAppliedCount}</p>
                </div>
            </motion.div>

            {/* Application rate bar */}
            {filtered.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="glass-panel shadow-card-depth rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-tertiary-muted">Application Rate</p>
                        <p className="text-xs font-black text-primary-accent">{Math.round((appliedCount / filtered.length) * 100)}%</p>
                    </div>
                    <div className="w-full h-2 bg-[#1B2A4A]/5 border border-[#1B2A4A]/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(appliedCount / filtered.length) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-neon-gradient shadow-neon-glow rounded-full"
                        />
                    </div>
                </motion.div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 glass-search shadow-card-depth rounded-xl px-4">
                <Search size={14} className="text-tertiary-muted" />
                <input type="text" placeholder="Search students..." className="bg-transparent border-none outline-none text-xs text-[#1B2A4A] p-3 w-full placeholder-tertiary-muted"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="glass-panel shadow-card-depth rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-[#1B2A4A]/5 bg-[#1B2A4A]/[0.02]">
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-secondary-muted">Student</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-secondary-muted">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-secondary-muted">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="3" className="px-6 py-20 text-center text-secondary-muted">
                                <div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" /> Syncing batch...</div>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-20 text-center text-tertiary-muted">No students found</td></tr>
                        ) : filtered.map((s, idx) => (
                            <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                className="hover:bg-[#1B2A4A]/[0.05] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#FF4D26]/20 border border-[#FF4D26]/50 flex items-center justify-center text-[10px] font-black text-[#1B2A4A]">
                                            {s.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1B2A4A]">{s.name}</p>
                                            <p className="text-[10px] text-tertiary-muted">{s.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-secondary-muted">
                                        <Mail size={14} className="hover:text-primary-accent cursor-pointer transition-colors" />
                                        <Phone size={14} className="hover:text-primary-accent cursor-pointer transition-colors" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${s.applied ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                        <span className={`font-black text-xs ${s.applied ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                                            {s.applied ? 'Applied' : 'Not Applied'}
                                        </span>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
}
