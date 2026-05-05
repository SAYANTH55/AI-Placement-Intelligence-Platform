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
                        <h1 className="text-2xl font-black tracking-tight">Student Batches</h1>
                        <p className="text-xs text-[#555] mt-1">Track student application status across placement drives</p>
                    </div>
                    <div className="flex gap-2">
                        <select className="bg-[#08080A] border border-[#181818] p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#F97316]"
                            value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                            {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                        </select>
                        <select className="bg-[#08080A] border border-[#181818] p-2.5 rounded-xl text-xs text-white outline-none focus:border-[#F97316]"
                            value={selectedDrive} onChange={e => setSelectedDrive(e.target.value)}>
                            {drives.map(d => <option key={d.id} value={d.id}>{d.company_name}</option>)}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Batch summary cards */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#08080A] border border-[#181818] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#818CF8]/10 rounded-lg"><Users size={16} className="text-[#818CF8]" /></div>
                        <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold">Total Students</p>
                    </div>
                    <p className="text-2xl font-black">{filtered.length}</p>
                </div>
                <div className="bg-[#08080A] border border-[#181818] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#34D399]/10 rounded-lg"><GraduationCap size={16} className="text-[#34D399]" /></div>
                        <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold">Applied</p>
                    </div>
                    <p className="text-2xl font-black text-[#34D399]">{appliedCount}</p>
                </div>
                <div className="bg-[#08080A] border border-[#181818] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#EF4444]/10 rounded-lg"><Users size={16} className="text-[#EF4444]" /></div>
                        <p className="text-[10px] uppercase tracking-widest text-[#555] font-bold">Not Applied</p>
                    </div>
                    <p className="text-2xl font-black text-[#EF4444]">{notAppliedCount}</p>
                </div>
            </motion.div>

            {/* Application rate bar */}
            {filtered.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-[#08080A] border border-[#181818] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-[#888]">Application Rate</p>
                        <p className="text-xs font-black text-[#F97316]">{Math.round((appliedCount / filtered.length) * 100)}%</p>
                    </div>
                    <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(appliedCount / filtered.length) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-[#F97316] to-[#34D399] rounded-full"
                        />
                    </div>
                </motion.div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 bg-[#08080A] border border-[#181818] rounded-xl px-4">
                <Search size={14} className="text-[#555]" />
                <input type="text" placeholder="Search students..." className="bg-transparent border-none outline-none text-xs text-white p-3 w-full"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-[#08080A] border border-[#181818] rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-[#141414] bg-[#0A0A0C]">
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Student</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[#555]">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]">
                        {loading ? (
                            <tr><td colSpan="3" className="px-6 py-20 text-center text-[#555]">
                                <div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" /> Syncing batch...</div>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-20 text-center text-[#444]">No students found</td></tr>
                        ) : filtered.map((s, idx) => (
                            <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316]/30 to-[#818CF8]/30 flex items-center justify-center text-[10px] font-black text-white border border-white/10">
                                            {s.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{s.name}</p>
                                            <p className="text-[10px] text-[#444]">{s.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-[#555]">
                                        <Mail size={14} className="hover:text-[#F97316] cursor-pointer transition-colors" />
                                        <Phone size={14} className="hover:text-[#F97316] cursor-pointer transition-colors" />
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
