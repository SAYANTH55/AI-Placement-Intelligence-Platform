import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import API from '../services/api';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChangePassword() {
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.new_password.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }
        if (form.new_password !== form.confirm_password) {
            setError('Passwords do not match');
            return;
        }
        if (form.current_password === form.new_password) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/change-password', {
                current_password: form.current_password,
                new_password: form.new_password
            });
            // Update user context to clear first_login flag
            const updatedUser = { ...user, first_login: false };
            setUser(updatedUser);
            navigate(user?.role === 'student' ? '/dashboard' : '/admin');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const isFirstLogin = user?.first_login;

    return (
        <div className="flex-1 flex items-center justify-center p-6" style={{ minHeight: '80vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="glass-panel shadow-card-depth rounded-3xl p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center mx-auto mb-4">
                            <Lock size={24} className="text-primary-accent" />
                        </div>
                        <h1 className="text-xl font-black text-[#1B2A4A]">
                            {isFirstLogin ? 'Set Your Password' : 'Change Password'}
                        </h1>
                        <p className="text-xs text-secondary-muted">
                            {isFirstLogin
                                ? 'Welcome to HireHive! Please set a secure password to continue.'
                                : 'Update your account password'}
                        </p>
                    </div>

                    {isFirstLogin && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-accent/5 border border-primary-accent/20 text-[11px] text-secondary-muted">
                            <AlertCircle size={14} className="text-primary-accent mt-0.5 shrink-0" />
                            <span>Your temporary password is your roll number: <strong className="text-[#1B2A4A]">{user?.roll_number || 'check your email'}</strong></span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">
                                {isFirstLogin ? 'Temporary Password (Roll Number)' : 'Current Password'}
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type={showCurrent ? 'text' : 'password'}
                                    value={form.current_password}
                                    onChange={e => setForm({ ...form, current_password: e.target.value })}
                                    placeholder={isFirstLogin ? 'Enter your roll number' : 'Enter current password'}
                                    className="w-full glass-search p-4 pr-12 rounded-2xl text-sm focus:border-primary-accent outline-none transition-colors text-[#1B2A4A] placeholder-tertiary-muted"
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary-muted hover:text-[#1B2A4A] transition-colors">
                                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">New Password</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showNew ? 'text' : 'password'}
                                    minLength={8}
                                    value={form.new_password}
                                    onChange={e => setForm({ ...form, new_password: e.target.value })}
                                    placeholder="Minimum 8 characters"
                                    className="w-full glass-search p-4 pr-12 rounded-2xl text-sm focus:border-primary-accent outline-none transition-colors text-[#1B2A4A] placeholder-tertiary-muted"
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary-muted hover:text-[#1B2A4A] transition-colors">
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-secondary-muted uppercase tracking-widest">Confirm New Password</label>
                            <input
                                required
                                type="password"
                                value={form.confirm_password}
                                onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                                placeholder="Re-enter new password"
                                className="w-full glass-search p-4 rounded-2xl text-sm focus:border-primary-accent outline-none transition-colors text-[#1B2A4A] placeholder-tertiary-muted"
                            />
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-neon-gradient text-[#1B2A4A] py-4 rounded-2xl font-black shadow-neon-glow hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2"
                        >
                            {loading ? 'Updating...' : <><ShieldCheck size={18} /> {isFirstLogin ? 'Set Password & Continue' : 'Update Password'}</>}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
