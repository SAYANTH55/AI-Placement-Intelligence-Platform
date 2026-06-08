import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { Users, Upload, Download, Search, Trash2, AlertCircle, CheckCircle, XCircle, UserPlus, Clock, X, GraduationCap, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentManagement() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCourse, setFilterCourse] = useState('ALL');
    const [filterBatch, setFilterBatch] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Add-student modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', roll_number: '', course: 'MCA', batch: '' });
    const [addLoading, setAddLoading] = useState(false);
    const [addSuccess, setAddSuccess] = useState(null); // { name, roll_number }
    const [addError, setAddError] = useState('');

    const fetchStudents = () => {
        setLoading(true);
        API.get('/provisioning/students')
            .then(res => setStudents(res.data.data || []))
            .catch(() => setStudents([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleDownloadTemplate = async () => {
        try {
            const res = await API.get('/provisioning/csv-template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student_import_template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch { alert('Failed to download template'); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await API.post('/provisioning/bulk-import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportResult(res.data.summary);
            fetchStudents();
        } catch (err) {
            setImportResult({ error: err.response?.data?.detail || 'Import failed' });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (sid, name) => {
        if (!window.confirm(`Delete "${name}"? This removes their account permanently.`)) return;
        try { await API.delete(`/provisioning/student/${sid}`); fetchStudents(); }
        catch (err) { alert(err.response?.data?.detail || 'Delete failed'); }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);
        try {
            const res = await API.post('/provisioning/add-student', {
                name: addForm.name.trim(),
                email: addForm.email.trim(),
                roll_number: addForm.roll_number.trim(),
                course: addForm.course,
                batch: addForm.batch.trim()
            });
            setAddSuccess({ name: res.data.student.name, roll_number: res.data.student.roll_number });
            setAddForm({ name: '', email: '', roll_number: '', course: 'MCA', batch: '', cgpa: '' });
            fetchStudents();
        } catch (err) {
            setAddError(err.response?.data?.detail || 'Failed to create student');
        } finally {
            setAddLoading(false);
        }
    };

    const closeAddModal = () => { setShowAddModal(false); setAddSuccess(null); setAddError(''); setAddForm({ name: '', email: '', roll_number: '', course: 'MCA', batch: '', cgpa: '' }); };

    const batches = [...new Set(students.map(s => s.batch).filter(Boolean))];
    const filtered = students.filter(s => {
        if (search && !(s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.roll_number?.toLowerCase().includes(search.toLowerCase()))) return false;
        if (filterCourse !== 'ALL' && s.course !== filterCourse) return false;
        if (filterBatch !== 'ALL' && s.batch !== filterBatch) return false;
        if (filterStatus === 'pending' && s.account_status !== 'pending') return false;
        if (filterStatus === 'active' && s.account_status !== 'active') return false;
        if (filterStatus === 'unassigned' && s.pr_name) return false;
        return true;
    });

    const pendingCount = students.filter(s => s.account_status === 'pending').length;
    const activeCount = students.filter(s => s.account_status === 'active').length;
    const unassignedCount = students.filter(s => !s.pr_name).length;

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <UserPlus className="text-primary-accent" size={24} /> Student Management
                    </h1>
                    <p className="text-xs text-secondary-muted mt-1">Import students via CSV or add individually, manage accounts, and track onboarding</p>
                </div>
                <button
                    onClick={() => { setShowAddModal(true); setAddSuccess(null); setAddError(''); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-neon-gradient text-white shadow-neon-glow hover:-translate-y-0.5 active:scale-95 transition-all shrink-0"
                >
                    <UserPlus size={14} /> Add Student
                </button>
            </motion.div>

            {/* CSV Import */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="glass-panel shadow-card-depth rounded-3xl p-6 space-y-4">
                    <h2 className="text-sm font-black text-white flex items-center gap-2"><Upload size={16} className="text-tertiary-muted" /> Bulk Import</h2>
                    <div className="flex flex-wrap gap-3 items-center">
                        <button onClick={handleDownloadTemplate} className="px-5 py-2.5 rounded-xl text-xs font-bold border border-white/10 bg-white/[0.04] text-secondary-muted hover:text-white hover:border-primary-accent transition-all flex items-center gap-2">
                            <Download size={14} /> Download Template
                        </button>
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                        <label htmlFor="csv-upload" className={`px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${importing ? 'bg-primary-accent/20 text-primary-accent border border-primary-accent/30' : 'bg-neon-gradient text-white shadow-neon-glow hover:-translate-y-0.5 active:scale-95'}`}>
                            {importing ? <><div className="w-3.5 h-3.5 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" /> Importing...</> : <><Upload size={14} /> Upload CSV</>}
                        </label>
                    </div>
                    <AnimatePresence>
                        {importResult && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                {importResult.error ? (
                                    <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><XCircle size={16} className="shrink-0 mt-0.5" /><span>{importResult.error}</span></div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-primary-accent/5 border border-primary-accent/20 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-white"><CheckCircle size={16} className="text-[#34D399]" /> Import Complete</div>
                                        <div className="flex gap-6 text-xs text-secondary-muted">
                                            <span><strong className="text-[#34D399]">{importResult.created}</strong> created</span>
                                            <span><strong className="text-amber-400">{importResult.skipped}</strong> skipped</span>
                                            <span><strong className="text-red-400">{importResult.errors?.length || 0}</strong> errors</span>
                                        </div>
                                        {importResult.errors?.length > 0 && <div className="mt-2 text-[10px] text-red-400/80 space-y-0.5 max-h-20 overflow-y-auto">{importResult.errors.map((e, i) => <div key={i}>• {e}</div>)}</div>}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-tertiary-muted">
                        <AlertCircle size={12} className="text-primary-accent mt-0.5 shrink-0" />
                        <span>Columns: <strong className="text-secondary-muted">name, email, roll_number, course, batch</strong>. Password = roll number. Students change on first login.</span>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: students.length, color: 'white/20', icon: <Users size={16} className="text-white" />, textColor: 'text-white' },
                    { label: 'Active', value: activeCount, color: '[#34D399]', icon: <CheckCircle size={16} className="text-[#34D399]" />, textColor: 'text-[#34D399]' },
                    { label: 'Pending', value: pendingCount, color: 'amber-400', icon: <Clock size={16} className="text-amber-400" />, textColor: 'text-amber-400' },
                    { label: 'Unassigned', value: unassignedCount, color: 'white/10', icon: <Users size={16} className="text-tertiary-muted" />, textColor: 'text-tertiary-muted' },
                ].map(c => (
                    <div key={c.label} className={`glass-panel shadow-card-depth rounded-2xl p-5 border-l-2 border-l-${c.color}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">{c.icon}</div>
                            <p className="text-[10px] uppercase tracking-widest text-secondary-muted font-bold">{c.label}</p>
                        </div>
                        <p className={`text-2xl font-black ${c.textColor}`}>{c.value}</p>
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 glass-search shadow-card-depth rounded-xl px-4 flex-1 min-w-[200px]">
                    <Search size={14} className="text-tertiary-muted" />
                    <input type="text" placeholder="Search name, email, roll number..." className="bg-transparent border-none outline-none text-xs text-white p-3 w-full placeholder-tertiary-muted" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="glass-search p-2.5 rounded-xl text-xs text-white outline-none" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                    <option value="ALL">All Courses</option><option value="MCA">MCA</option><option value="MSAIM">MSAIM</option>
                </select>
                <select className="glass-search p-2.5 rounded-xl text-xs text-white outline-none" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
                    <option value="ALL">All Batches</option>{batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select className="glass-search p-2.5 rounded-xl text-xs text-white outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="ALL">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="unassigned">Unassigned</option>
                </select>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel shadow-card-depth rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Student', 'Roll No', 'Course', 'Batch', 'PR Assigned', 'Status', ''].map(h => (
                                <th key={h} className={`px-5 py-4 font-black uppercase tracking-widest text-secondary-muted ${h === '' ? 'text-right' : ''}`}>{h || 'Actions'}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="7" className="px-6 py-20 text-center text-secondary-muted"><div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" /> Loading...</div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-20 text-center text-tertiary-muted">{students.length === 0 ? 'No students yet. Upload a CSV to get started.' : 'No matches.'}</td></tr>
                        ) : filtered.map((s, i) => (
                            <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }} className="hover:bg-white/[0.03] transition-colors">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-accent/15 border border-primary-accent/30 flex items-center justify-center text-[10px] font-black text-primary-accent">{s.name?.[0] || '?'}</div>
                                        <div><p className="font-bold text-white">{s.name}</p><p className="text-[10px] text-tertiary-muted">{s.email}</p></div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-secondary-muted">{s.roll_number || '—'}</td>
                                <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${s.course === 'MCA' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{s.course || '—'}</span></td>
                                <td className="px-5 py-3.5 text-secondary-muted">{s.batch || '—'}</td>
                                <td className="px-5 py-3.5">{s.pr_name ? <span className="text-white font-medium">{s.pr_name}</span> : <span className="text-tertiary-muted italic">Unassigned</span>}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${s.account_status === 'active' ? 'bg-[#34D399] shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'}`} />
                                        <span className={`text-[10px] font-black uppercase ${s.account_status === 'active' ? 'text-[#34D399]' : 'text-amber-400'}`}>{s.account_status === 'active' ? 'Active' : 'Pending'}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Delete"><Trash2 size={13} /></button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filtered.length > 0 && <div className="px-5 py-3 border-t border-white/5 text-[10px] text-tertiary-muted">Showing {filtered.length} of {students.length}</div>}
            </motion.div>

            {/* ── Add Student Modal ───────────────────────────────── */}
            <AnimatePresence>
                {showAddModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeAddModal}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f0f0f] border-l border-white/10 shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center">
                                        <GraduationCap size={18} className="text-primary-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">Add Student</p>
                                        <p className="text-[10px] text-tertiary-muted">Manually create one account</p>
                                    </div>
                                </div>
                                <button onClick={closeAddModal} className="p-1.5 text-tertiary-muted hover:text-white transition-colors"><X size={18} /></button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

                                {/* Success banner */}
                                <AnimatePresence>
                                    {addSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="p-4 rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 space-y-2"
                                        >
                                            <div className="flex items-center gap-2 text-xs font-bold text-[#34D399]">
                                                <CheckCircle size={14} /> Account created for {addSuccess.name}
                                            </div>
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/5">
                                                <KeyRound size={13} className="text-amber-400 shrink-0" />
                                                <span className="text-[11px] text-secondary-muted">Temp password: <strong className="text-white font-mono">{addSuccess.roll_number}</strong></span>
                                            </div>
                                            <p className="text-[10px] text-tertiary-muted">Student will be prompted to change it on first login.</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error */}
                                {addError && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                        <XCircle size={14} className="shrink-0 mt-0.5" /> {addError}
                                    </div>
                                )}

                                <form id="add-student-form" onSubmit={handleAddStudent} className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">Full Name *</label>
                                        <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})}
                                            placeholder="e.g. Riya Sharma"
                                            className="w-full glass-search p-3.5 rounded-xl text-sm text-white placeholder-tertiary-muted outline-none focus:border-primary-accent transition-colors" />
                                    </div>
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">College Email *</label>
                                        <input required type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})}
                                            placeholder="riya@college.edu"
                                            className="w-full glass-search p-3.5 rounded-xl text-sm text-white placeholder-tertiary-muted outline-none focus:border-primary-accent transition-colors" />
                                    </div>
                                    {/* Roll Number */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">Roll Number * <span className="text-primary-accent">(used as temp password)</span></label>
                                        <input required value={addForm.roll_number} onChange={e => setAddForm({...addForm, roll_number: e.target.value})}
                                            placeholder="e.g. MCA2025042"
                                            className="w-full glass-search p-3.5 rounded-xl text-sm font-mono text-white placeholder-tertiary-muted outline-none focus:border-primary-accent transition-colors" />
                                    </div>
                                    {/* Course + Batch */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">Course *</label>
                                            <select required value={addForm.course} onChange={e => setAddForm({...addForm, course: e.target.value})}
                                                className="w-full glass-search p-3.5 rounded-xl text-sm text-white outline-none">
                                                <option value="MCA">MCA</option>
                                                <option value="MSAIM">MSAIM</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-muted">Batch *</label>
                                            <input required value={addForm.batch} onChange={e => setAddForm({...addForm, batch: e.target.value})}
                                                placeholder="MCA 2025 A"
                                                className="w-full glass-search p-3.5 rounded-xl text-sm text-white placeholder-tertiary-muted outline-none focus:border-primary-accent transition-colors" />
                                        </div>
                                    </div>
                                    {/* CGPA (optional) */}

                                </form>

                                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-tertiary-muted">
                                    <AlertCircle size={12} className="text-primary-accent mt-0.5 shrink-0" />
                                    <span>The student logs in with their <strong className="text-secondary-muted">email</strong> + <strong className="text-secondary-muted">roll number</strong> as the temporary password and must change it on first login.</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                                <button onClick={closeAddModal} className="flex-1 py-3 rounded-xl text-xs font-bold border border-white/10 text-secondary-muted hover:text-white hover:border-white/20 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" form="add-student-form" disabled={addLoading}
                                    className="flex-1 py-3 rounded-xl text-xs font-black bg-neon-gradient text-white shadow-neon-glow hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {addLoading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : <><UserPlus size={14} />Create Account</>}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
