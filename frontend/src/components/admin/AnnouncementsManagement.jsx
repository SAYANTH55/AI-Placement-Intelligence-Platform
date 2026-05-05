import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Plus, Edit2, Trash2, Bell, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementsManagement() {
    const [updates, setUpdates] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ 
        title: '', 
        description: '', 
        update_type: 'announcement', 
        course: 'ALL', 
        action_label: '', 
        action_url: '' 
    });

    const fetchUpdates = () => {
        setLoading(true);
        API.get('/placement-updates/all')
            .then(res => setUpdates(res.data.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUpdates(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await API.patch(`/placement-updates/${editingId}`, form);
            } else {
                await API.post('/placement-updates/create', form);
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ title: '', description: '', update_type: 'announcement', course: 'ALL', action_label: '', action_url: '' });
            fetchUpdates();
        } catch (err) {
            alert(err.response?.data?.detail || err.message || "Failed to save announcement.");
        } finally { setLoading(false); }
    };

    const handleEdit = (update) => {
        setForm({
            title: update.title || '',
            description: update.description || '',
            update_type: update.update_type || 'announcement',
            course: update.course || 'ALL',
            action_label: update.action_label || '',
            action_url: update.action_url || ''
        });
        setEditingId(update.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await API.delete(`/placement-updates/${id}`);
            fetchUpdates();
        } catch (err) {
            alert("Failed to delete announcement.");
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">Announcements</h1>
                    <p className="text-xs text-secondary-muted mt-1">Manage notices, test links, and workshops</p>
                </div>
                <button onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) {
                        setEditingId(null);
                        setForm({ title: '', description: '', update_type: 'announcement', course: 'ALL', action_label: '', action_url: '' });
                    }
                }}
                    className="flex items-center gap-2 bg-neon-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-neon-glow hover:-translate-y-0.5 transition-all">
                    <Plus size={16} /> {showForm ? 'Cancel' : 'New Announcement'}
                </button>
            </motion.div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <form onSubmit={handleSubmit} className="glass-panel shadow-card-depth rounded-3xl p-6 space-y-4 mb-8">
                            <h2 className="text-lg font-black text-white mb-4">{editingId ? 'Edit Announcement' : 'Create Announcement'}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Title" className="col-span-2 glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                                <select className="glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none text-white" value={form.update_type} onChange={e => setForm({...form, update_type: e.target.value})}>
                                    <option value="announcement">Announcement</option>
                                    <option value="test">Test</option>
                                    <option value="workshop">Workshop</option>
                                </select>
                                <select className="glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none text-white" value={form.course} onChange={e => setForm({...form, course: e.target.value})}>
                                    <option value="ALL">All Courses</option>
                                    <option value="MCA">MCA</option>
                                    <option value="MSAIM">MSc AI/ML</option>
                                </select>
                            </div>
                            <textarea placeholder="Description" className="w-full glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none h-24 transition-colors text-white placeholder-tertiary-muted" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Action Label (e.g. Register Now)" className="glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted" value={form.action_label} onChange={e => setForm({...form, action_label: e.target.value})} />
                                <input placeholder="Action URL (Link)" className="glass-search p-3 rounded-xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted" value={form.action_url} onChange={e => setForm({...form, action_url: e.target.value})} />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-neon-gradient text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-neon-glow hover:-translate-y-0.5 transition-all">
                                {loading ? 'Saving...' : (editingId ? 'Save Changes' : 'Post Announcement')}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && !showForm ? (
                <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-4">
                    {updates.map((update, idx) => (
                        <motion.div key={update.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            className="glass-panel shadow-card-depth rounded-2xl p-5 hover:border-primary-accent/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                                      update.update_type === 'test' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                      update.update_type === 'workshop' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-secondary-muted border-white/10'
                                    }`}>
                                        {update.update_type}
                                    </span>
                                    <span className="px-2 py-0.5 bg-white/5 text-secondary-muted border border-white/10 rounded-md text-[10px] font-black uppercase tracking-widest">
                                        {update.course}
                                    </span>
                                </div>
                                <h3 className="font-black text-lg text-white mb-1">{update.title}</h3>
                                {update.description && <p className="text-sm text-secondary-muted">{update.description}</p>}
                                
                                {update.action_url && (
                                    <a href={update.action_url} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs font-black text-primary-accent hover:underline">
                                        {update.action_label || 'View Link'} &rarr;
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-2 md:flex-col justify-center">
                                <button onClick={() => handleEdit(update)} className="p-2 rounded-xl text-secondary-muted hover:text-primary-accent hover:bg-white/5 transition-colors" title="Edit">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(update.id)} className="p-2 rounded-xl text-secondary-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {updates.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                            <Bell className="mx-auto text-tertiary-muted mb-4" size={32} />
                            <p className="text-secondary-muted">No announcements found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
