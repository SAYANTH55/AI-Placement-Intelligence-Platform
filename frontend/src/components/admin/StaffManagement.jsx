import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Shield, AlertCircle, Plus, Users, Trash2, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

export default function StaffManagement() {
    const { user } = useAppContext();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'pr', department_id: '', batch: '' });
    const [departments, setDepartments] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(true);

    const fetchStaff = () => {
        setStaffLoading(true);
        API.get('/auth/admin/staff')
            .then(res => setStaffList(res.data.data || []))
            .catch(() => setStaffList([]))
            .finally(() => setStaffLoading(false));
    };

    useEffect(() => {
        API.get('/department/all')
            .then(res => setDepartments(res.data.data || []))
            .catch(() => setDepartments([]));
        fetchStaff();
    }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/auth/admin/create-staff', form);
            setForm({ fullName: '', email: '', password: '', role: 'pr', department_id: '' });
            alert(`${form.role === 'pr' ? 'Placement Officer' : 'Admin'} account created successfully! They can now log in.`);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to create account.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (staffId, name) => {
        if (!window.confirm(`Are you sure you want to revoke access for ${name}? This will deactivate their account.`)) return;
        try {
            await API.delete(`/auth/admin/staff/${staffId}`);
            alert("Account deactivated successfully.");
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to delete account.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
                        <Shield className="text-primary-accent" size={24} /> Manage Staff Access
                    </h1>
                    <p className="text-xs text-secondary-muted mt-1">Create and manage accounts for Admins and Placement Officers (PRs)</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <form onSubmit={handleCreateStaff} className="glass-panel shadow-card-depth rounded-3xl p-8 space-y-6">
                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                        <Users size={18} className="text-tertiary-muted" /> Create New Account
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Full Name</label>
                            <input
                                required
                                value={form.fullName}
                                onChange={e => setForm({...form, fullName: e.target.value})}
                                placeholder="Enter full name"
                                className="w-full glass-search p-4 rounded-2xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Email Address</label>
                            <input
                                required type="email"
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                                placeholder="name@college.edu"
                                className="w-full glass-search p-4 rounded-2xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Set Password</label>
                        <input
                            required type="password" minLength={8}
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            placeholder="Minimum 8 characters"
                            className="w-full glass-search p-4 rounded-2xl text-sm focus:border-primary-accent outline-none transition-colors text-white placeholder-tertiary-muted"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Account Role</label>
                            <select
                                value={form.role}
                                onChange={e => setForm({...form, role: e.target.value})}
                                className="w-full glass-search p-4 rounded-2xl text-sm focus:border-primary-accent outline-none text-white transition-colors"
                            >
                                <option value="pr">Placement Officer (PR)</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        
                        {form.role === 'pr' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Assign Department</label>
                                <select
                                    value={form.department_id}
                                    onChange={e => setForm({...form, department_id: e.target.value})}
                                    className="w-full glass-search p-4 rounded-2xl text-sm focus:border-primary-accent outline-none text-tertiary-muted transition-colors"
                                >
                                    <option value="">None (Global Access)</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 bg-primary-accent/5 border border-primary-accent/20 rounded-2xl p-4 text-xs text-tertiary-muted flex items-start gap-2">
                        <AlertCircle size={14} className="text-primary-accent mt-0.5 shrink-0" />
                        <span>Share the credentials securely with the new user. They can change their password later via the "Forgot Password" feature.</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-neon-gradient text-white py-4 rounded-2xl font-black shadow-neon-glow hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? 'Creating Account...' : <><Plus size={18} /> Create Account</>}
                    </button>
                </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="glass-panel shadow-card-depth rounded-3xl p-8 space-y-6">
                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                        <UserCheck size={18} className="text-tertiary-muted" /> Active Staff Accounts
                    </h2>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-secondary-muted">Name</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-secondary-muted">Role</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-secondary-muted">Department</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-secondary-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {staffLoading ? (
                                    <tr><td colSpan="4" className="px-4 py-8 text-center text-tertiary-muted">Loading staff list...</td></tr>
                                ) : staffList.length === 0 ? (
                                    <tr><td colSpan="4" className="px-4 py-8 text-center text-tertiary-muted">No active staff accounts found.</td></tr>
                                ) : (
                                    staffList.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-white/[0.05] transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-white">{staff.name}</p>
                                                <p className="text-[10px] text-tertiary-muted">{staff.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${staff.role === 'admin' ? 'bg-[#FF4D26]/10 text-primary-accent' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {staff.role === 'pr' ? 'PR Officer' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-secondary-muted font-medium">{staff.department}</td>
                                            <td className="px-4 py-3 text-right">
                                                {user?.id !== staff.id && (
                                                    <button
                                                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                                        className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all inline-flex items-center gap-1.5"
                                                        title="Revoke Access"
                                                    >
                                                        <Trash2 size={14} /> <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Revoke</span>
                                                    </button>
                                                )}
                                                {user?.id === staff.id && (
                                                    <span className="text-[10px] font-bold text-tertiary-muted uppercase tracking-wider">Current User</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
