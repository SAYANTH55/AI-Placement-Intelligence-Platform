import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Shield, AlertCircle, Plus, Users, Trash2, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

export default function StaffManagement() {
    const { user } = useAppContext();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'pr', department_id: '' });
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
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Shield className="text-[#F97316]" size={24} /> Manage Staff Access
                    </h1>
                    <p className="text-xs text-[#555] mt-1">Create and manage accounts for Admins and Placement Officers (PRs)</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <form onSubmit={handleCreateStaff} className="bg-[#08080A] border border-[#181818] rounded-3xl p-8 space-y-6">
                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                        <Users size={18} className="text-[#888]" /> Create New Account
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Full Name</label>
                            <input
                                required
                                value={form.fullName}
                                onChange={e => setForm({...form, fullName: e.target.value})}
                                placeholder="Enter full name"
                                className="w-full bg-[#050505] border border-[#1A1A1A] p-4 rounded-2xl text-sm focus:border-[#F97316] outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Email Address</label>
                            <input
                                required type="email"
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                                placeholder="name@college.edu"
                                className="w-full bg-[#050505] border border-[#1A1A1A] p-4 rounded-2xl text-sm focus:border-[#F97316] outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Set Password</label>
                        <input
                            required type="password" minLength={8}
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            placeholder="Minimum 8 characters"
                            className="w-full bg-[#050505] border border-[#1A1A1A] p-4 rounded-2xl text-sm focus:border-[#F97316] outline-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Account Role</label>
                            <select
                                value={form.role}
                                onChange={e => setForm({...form, role: e.target.value})}
                                className="w-full bg-[#050505] border border-[#1A1A1A] p-4 rounded-2xl text-sm focus:border-[#F97316] outline-none text-white transition-colors"
                            >
                                <option value="pr">Placement Officer (PR)</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        
                        {form.role === 'pr' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[#555] uppercase tracking-widest">Assign Department</label>
                                <select
                                    value={form.department_id}
                                    onChange={e => setForm({...form, department_id: e.target.value})}
                                    className="w-full bg-[#050505] border border-[#1A1A1A] p-4 rounded-2xl text-sm focus:border-[#F97316] outline-none text-[#888] transition-colors"
                                >
                                    <option value="">None (Global Access)</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 bg-[#F97316]/5 border border-[#F97316]/20 rounded-2xl p-4 text-xs text-[#888] flex items-start gap-2">
                        <AlertCircle size={14} className="text-[#F97316] mt-0.5 shrink-0" />
                        <span>Share the credentials securely with the new user. They can change their password later via the "Forgot Password" feature.</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? 'Creating Account...' : <><Plus size={18} /> Create Account</>}
                    </button>
                </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="bg-[#08080A] border border-[#181818] rounded-3xl p-8 space-y-6">
                    <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                        <UserCheck size={18} className="text-[#888]" /> Active Staff Accounts
                    </h2>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#141414] bg-white/[0.02]">
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[#555]">Name</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[#555]">Role</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[#555]">Department</th>
                                    <th className="px-4 py-3 font-black uppercase tracking-widest text-[#555] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#141414]">
                                {staffLoading ? (
                                    <tr><td colSpan="4" className="px-4 py-8 text-center text-[#555]">Loading staff list...</td></tr>
                                ) : staffList.length === 0 ? (
                                    <tr><td colSpan="4" className="px-4 py-8 text-center text-[#444]">No active staff accounts found.</td></tr>
                                ) : (
                                    staffList.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-white">{staff.name}</p>
                                                <p className="text-[10px] text-[#555]">{staff.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${staff.role === 'admin' ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {staff.role === 'pr' ? 'PR Officer' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#888] font-medium">{staff.department}</td>
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
                                                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Current User</span>
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
