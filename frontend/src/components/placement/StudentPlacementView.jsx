import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const StudentPlacementView = () => {
    const [drives, setDrives] = useState([]);

    const statusBadgeColor = (status) => {
        if (status === 'active' || status === 'open' || status === 'Active') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (status === 'closed' || status === 'Closed') return 'bg-red-500/10 text-red-400 border-red-500/20';
        return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
    };

    const cardBorderColor = (status) => {
        if (status === 'closed' || status === 'Closed') return '!border-red-500/30 !shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:!border-red-500/50 hover:!shadow-[0_0_30px_rgba(239,68,68,0.25)] bg-red-500/5';
        if (status === 'active' || status === 'open' || status === 'Active') return '!border-blue-500/40 !shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:!border-blue-500/60 hover:!shadow-[0_0_35px_rgba(59,130,246,0.3)] bg-blue-500/5';
        return 'border-[#181818] hover:border-[#F97316]/30';
    };

    useEffect(() => {
        API.get('/drive/s?active_only=true')
            .then(res => {
                if (res.data.data) setDrives(res.data.data);
            })
            .catch(err => {
                console.error("Failed to fetch drives:", err);
            });
    }, []);

    return (
        <div className="p-8 bg-[#060606] min-h-screen text-white w-full">
            <h1 className="text-[#F97316] mb-4 text-3xl font-black tracking-tight">Placement Opportunities</h1>
            <p className="text-sm text-[#555] mb-8 font-medium">AI Readiness Score indicates your likelihood of passing the first rounds for these roles.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mb-8">
                {drives.length > 0 ? drives.map((drive, idx) => (
                    <div key={idx} className={`bg-[#08080A] border rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(249,115,22,0.03)] transition-all ${cardBorderColor(drive.status)}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black text-white">{drive.company_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#F97316]">{drive.role}</p>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${statusBadgeColor(drive.status)}`}>{drive.status}</span>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black rounded-full whitespace-nowrap ml-2">High Readiness</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs text-[#555] font-semibold flex items-center gap-1">Deadline: {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : 'Ongoing'}</p>
                            {drive.ctc && <span className="text-xs font-black text-green-400">{drive.ctc}</span>}
                        </div>
                        
                        {drive.description && (
                            <p className="text-xs text-[#888] mb-6 line-clamp-2 italic">"{drive.description}"</p>
                        )}
                        
                        <button className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-black text-sm py-3 rounded-xl transition-all duration-200">
                            Apply Now
                        </button>
                    </div>
                )) : (
                    <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-12 shadow-[0_0_20px_rgba(249,115,22,0.03)] col-span-full text-center">
                        <p className="text-[#555] text-sm">No active placement drives found.</p>
                    </div>
                )}
            </div>

            <div className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 w-full max-w-6xl">
                <h3 className="text-lg font-black text-white mb-2">My Application Tracking</h3>
                <p className="text-sm text-[#555]">You have no active applications.</p>
            </div>
        </div>
    );
};

export default StudentPlacementView;
