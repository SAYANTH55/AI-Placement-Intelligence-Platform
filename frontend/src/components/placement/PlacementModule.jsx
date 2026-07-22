import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { Briefcase, CheckCircle, Clock, FileText, Send, AlertCircle, ChevronRight, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PlacementModule = () => {
    const { user } = useAppContext();
    const [drives, setDrives] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState(null);
    const [message, setMessage] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [drivesRes, appsRes] = await Promise.all([
                API.get('/drive/s?active_only=true'),
                API.get('/application/my-applications')
            ]);
            setDrives(drivesRes.data.data);
            setMyApplications(appsRes.data.data);
        } catch (err) {
            console.error("Failed to fetch placement data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApply = async (driveId) => {
        setApplyingId(driveId);
        try {
            await API.post('/application/apply', {
                drive_id: driveId,
                resume_path: "mock_resume_from_profile.pdf" // In real system, would use uploaded file
            });
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to apply.' });
        } finally {
            setApplyingId(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const isApplied = (driveId) => myApplications.some(app => app.drive_id === driveId);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-[#1B2A4A] tracking-tight mb-2">Placement Opportunities</h1>
                <p className="text-[#888888] text-sm">Track your applications and apply to new drives matching your profile.</p>
            </div>

            {/* Notification Bar */}
            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 border ${
                            message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Available Drives */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="text-[#1B2A4A]" size={20} />
                        <h2 className="text-xl font-black text-[#1B2A4A]">Active Drives</h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map(i => <div key={i} className="h-48 bg-[#08080A] rounded-3xl animate-pulse" />)}
                        </div>
                    ) : drives.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {drives.map(drive => (
                                <div key={drive.id} className="bg-[#08080A] border border-[#181818] rounded-3xl p-6 hover:border-[#1B2A4A]/30 transition-all relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-[#1B2A4A] group-hover:text-[#1B2A4A] transition-colors">{drive.company_name}</h3>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-[#888888] mt-0.5">{drive.role}</p>
                                        </div>
                                        {isApplied(drive.id) ? (
                                            <span className="bg-[#1B2A4A]/10 text-[#1B2A4A] p-1.5 rounded-lg"><CheckCircle size={14} /></span>
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-[#1B2A4A]/2 flex items-center justify-center text-[#333]"><Target size={14} /></div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-[10px] text-[#888888] font-bold">
                                            <Clock size={12} /> Deadline: {new Date(drive.deadline).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleApply(drive.id)}
                                        disabled={isApplied(drive.id) || applyingId === drive.id}
                                        className={`w-full py-3 rounded-xl font-black text-xs transition-all ${
                                            isApplied(drive.id) 
                                            ? 'bg-[#1B2A4A]/5 text-[#888888] cursor-not-allowed'
                                            : 'bg-[#1B2A4A] text-white hover:bg-[#9ECCFA] shadow-[0_0_20px_rgba(27,42,74,0.2)]'
                                        }`}
                                    >
                                        {applyingId === drive.id ? 'Submitting...' : isApplied(drive.id) ? 'Applied' : 'Apply Now'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#08080A] border border-dashed border-[#181818] rounded-3xl p-12 text-center">
                            <p className="text-[#888888] text-sm">No new placement drives at the moment.</p>
                        </div>
                    )}
                </div>

                {/* My Applications / Progress */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-[#818CF8]" size={20} />
                        <h2 className="text-xl font-black text-[#1B2A4A]">My Progress</h2>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="h-24 bg-[#08080A] rounded-2xl animate-pulse" />)
                        ) : myApplications.length > 0 ? myApplications.map(app => (
                            <div key={app.id} className="bg-[#08080A] border border-[#181818] rounded-2xl p-5 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm font-black text-[#1B2A4A]">{app.company_name}</p>
                                        <p className="text-[10px] text-[#888888] font-bold">{app.role}</p>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${
                                        app.status === 'Placed' ? 'bg-green-500/10 text-green-400' : 
                                        app.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-[#1B2A4A]/5 text-[#888888555]'
                                    }`}>
                                        {app.status}
                                    </span>
                                </div>

                                {/* Mini Timeline */}
                                <div className="mt-4 flex items-center gap-1.5">
                                    {[1, 2, 3].map(step => (
                                        <div 
                                            key={step}
                                            className={`h-1 flex-1 rounded-full ${
                                                step < app.current_round ? 'bg-[#1B2A4A]' : 
                                                step === app.current_round ? 'bg-[#1B2A4A]/30' : 'bg-[#1B2A4A]/5'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-[9px] font-black text-[#333] uppercase">Aptitude</span>
                                    <span className="text-[9px] font-black text-[#333] uppercase">Tech</span>
                                    <span className="text-[9px] font-black text-[#333] uppercase">HR</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center bg-[#1B2A4A]/1 rounded-2xl border border-dashed border-[#181818]">
                                <p className="text-[10px] text-[#333] font-bold uppercase tracking-widest">No Active Applications</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PlacementModule;
