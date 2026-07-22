import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Users, UserCheck, ArrowRight, Search, CheckSquare, Square, RefreshCw, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BatchSelector from '../common/BatchSelector';

export default function PRMappings() {
    const [prs, setPrs] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedPR, setSelectedPR] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [search, setSearch] = useState('');
    const [batch, setBatch] = useState(''); // '' means all batches

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prRes, stRes] = await Promise.all([
                API.get('/provisioning/prs', { params: batch ? { batch } : {} }),
                API.get('/provisioning/students')
            ]);
            setPrs(prRes.data.data || []);
            setStudents(stRes.data.data || []);
        } catch { setPrs([]); setStudents([]); }
        finally { setLoading(false); }
    };

    // Refetch when batch changes
    useEffect(() => { fetchData(); }, [batch]);

    // Filter students based on selected batch (if any)
    const filteredStudents = batch ? students.filter(s => s.batch === batch) : students;
    const unassigned = filteredStudents.filter(s => !s.pr_id);
    const assignedToSelected = selectedPR ? filteredStudents.filter(s => s.pr_id === selectedPR.id) : [];
    const totalStudents = filteredStudents.length;
    const totalAssigned = filteredStudents.filter(s => s.pr_id).length;

    const filteredUnassigned = unassigned.filter(s =>
        !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.roll_number?.toLowerCase().includes(search.toLowerCase())
    );

    const toggleStudent = (sid) => {
        setSelectedStudents(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
    };

    const selectAllVisible = () => {
        const ids = filteredUnassigned.map(s => s.id);
        const allSelected = ids.every(id => selectedStudents.includes(id));
        setSelectedStudents(allSelected ? selectedStudents.filter(id => !ids.includes(id)) : [...new Set([...selectedStudents, ...ids])]);
    };

    const handleAssign = async () => {
        if (!selectedPR || selectedStudents.length === 0) return;
        setAssigning(true);
        try {
            await API.post('/provisioning/assign', { pr_id: selectedPR.id, student_ids: selectedStudents });
            setSelectedStudents([]);
            await fetchData();
        } catch (err) { alert(err.response?.data?.detail || 'Assignment failed'); }
        finally { setAssigning(false); }
    };

    const handleUnassign = async (studentIds) => {
        if (!window.confirm(`Unassign ${studentIds.length} student(s) from this PR?`)) return;
        try {
            await API.post('/provisioning/unassign', { student_ids: studentIds });
            await fetchData();
        } catch (err) { alert(err.response?.data?.detail || 'Unassign failed'); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-secondary-muted gap-3">
                <div className="w-5 h-5 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
                Loading mapping data...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-black tracking-tight text-[#1B2A4A] flex items-center gap-2">
                    <Link2 className="text-primary-accent" size={24} /> PR — Student Mappings
                </h1>
                <p className="text-xs text-secondary-muted mt-1">Assign students to Placement Representatives. {totalAssigned}/{totalStudents} students assigned.</p>
            </motion.div>

            {/* Progress bar */}
            {totalStudents > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel shadow-card-depth rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-tertiary-muted">Overall Assignment Progress</p>
                        <p className="text-xs font-black text-primary-accent">{Math.round((totalAssigned / totalStudents) * 100)}%</p>
                    </div>
                    <div className="w-full h-2 bg-[#1B2A4A]/5 border border-[#1B2A4A]/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(totalAssigned / totalStudents) * 100}%` }} transition={{ duration: 1 }} className="h-full bg-neon-gradient shadow-neon-glow rounded-full" />
                    </div>
                </motion.div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* LEFT: PR Cards */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-[#1B2A4A] flex items-center gap-2"><Users size={16} className="text-tertiary-muted" /> Placement Reps ({prs.length})</h2>
                        <button onClick={fetchData} className="p-1.5 text-tertiary-muted hover:text-primary-accent transition-colors" title="Refresh"><RefreshCw size={14} /></button>
                    </div>
                    <BatchSelector selectedBatch={batch} onBatchChange={setBatch} />
                    {prs.length === 0 ? (
                        <div className="glass-panel shadow-card-depth rounded-2xl p-8 text-center text-tertiary-muted text-xs">
                            No PRs found. Create PR accounts in Staff Management first.
                        </div>
                    ) : prs.map((pr, i) => (
                        <motion.div
                            key={pr.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { setSelectedPR(pr); setSelectedStudents([]); setSearch(''); }}
                            className={`glass-panel shadow-card-depth rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${
                                selectedPR?.id === pr.id ? 'border-primary-accent/50 shadow-neon-glow' : 'hover:border-[#1B2A4A]/10'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
                                    selectedPR?.id === pr.id ? 'bg-primary-accent text-[#1B2A4A]' : 'bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 text-secondary-muted'
                                }`}>
                                    {pr.name?.[0] || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#1B2A4A] text-sm truncate">{pr.name}</p>
                                    <p className="text-[10px] text-tertiary-muted truncate">{pr.email}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-lg font-black ${pr.student_count > 0 ? 'text-primary-accent' : 'text-tertiary-muted'}`}>{pr.student_count}</p>
                                    <p className="text-[9px] text-tertiary-muted uppercase tracking-wider">students</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* RIGHT: Student Assignment */}
                <div className="lg:col-span-3 space-y-4">
                    {!selectedPR ? (
                        <div className="glass-panel shadow-card-depth rounded-2xl p-16 text-center">
                            <ArrowRight size={32} className="text-tertiary-muted mx-auto mb-4 opacity-30" />
                            <p className="text-sm text-tertiary-muted">Select a PR from the left to manage their students</p>
                        </div>
                    ) : (
                        <>
                            {/* Selected PR info */}
                            <div className="glass-panel shadow-card-depth rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-[#1B2A4A] font-black text-xs">{selectedPR.name?.[0]}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[#1B2A4A]">Managing: {selectedPR.name}</p>
                                    <p className="text-[10px] text-tertiary-muted">{assignedToSelected.length} students assigned</p>
                                </div>
                            </div>

                            {/* Assigned students */}
                            {assignedToSelected.length > 0 && (
                                <div className="glass-panel shadow-card-depth rounded-2xl overflow-hidden">
                                    <div className="px-5 py-3 border-b border-[#1B2A4A]/5 flex items-center justify-between">
                                        <h3 className="text-xs font-black text-[#1B2A4A] flex items-center gap-2"><UserCheck size={14} className="text-[#34D399]" /> Assigned ({assignedToSelected.length})</h3>
                                        <button onClick={() => handleUnassign(assignedToSelected.map(s => s.id))} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">Unassign All</button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                                        {assignedToSelected.map(s => (
                                            <div key={s.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-[#1B2A4A]/[0.03] transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center text-[9px] font-black text-[#34D399]">{s.name?.[0]}</div>
                                                    <div><p className="text-xs font-medium text-[#1B2A4A]">{s.name}</p><p className="text-[9px] text-tertiary-muted">{s.roll_number}</p></div>
                                                </div>
                                                <button onClick={() => handleUnassign([s.id])} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Unassigned students */}
                            <div className="glass-panel shadow-card-depth rounded-2xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-[#1B2A4A]/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-black text-[#1B2A4A] flex items-center gap-2"><Users size={14} className="text-tertiary-muted" /> Unassigned ({unassigned.length})</h3>
                                        {selectedStudents.length > 0 && (
                                            <button onClick={handleAssign} disabled={assigning}
                                                className="px-4 py-1.5 rounded-lg text-[10px] font-black bg-neon-gradient text-[#1B2A4A] shadow-neon-glow hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-1.5">
                                                {assigning ? 'Assigning...' : <><ArrowRight size={12} /> Assign {selectedStudents.length} to {selectedPR.name}</>}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 glass-search rounded-lg px-3 flex-1">
                                            <Search size={12} className="text-tertiary-muted" />
                                            <input type="text" placeholder="Search unassigned..." className="bg-transparent border-none outline-none text-[11px] text-[#1B2A4A] py-2 w-full placeholder-tertiary-muted" value={search} onChange={e => setSearch(e.target.value)} />
                                        </div>
                                        <button onClick={selectAllVisible} className="text-[10px] font-bold text-secondary-muted hover:text-primary-accent transition-colors whitespace-nowrap">
                                            {filteredUnassigned.length > 0 && filteredUnassigned.every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                                    {filteredUnassigned.length === 0 ? (
                                        <div className="px-5 py-10 text-center text-tertiary-muted text-xs">
                                            {unassigned.length === 0 ? 'All students are assigned!' : 'No matches found.'}
                                        </div>
                                    ) : filteredUnassigned.map(s => (
                                        <div key={s.id} onClick={() => toggleStudent(s.id)} className="px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-[#1B2A4A]/[0.03] transition-colors">
                                            {selectedStudents.includes(s.id) ? (
                                                <CheckSquare size={16} className="text-primary-accent shrink-0" />
                                            ) : (
                                                <Square size={16} className="text-tertiary-muted shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-[#1B2A4A] truncate">{s.name}</p>
                                                <p className="text-[9px] text-tertiary-muted">{s.roll_number} · {s.course} · {s.batch}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
