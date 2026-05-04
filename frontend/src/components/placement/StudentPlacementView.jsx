import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const StudentPlacementView = () => {
    const [drives, setDrives] = useState([]);

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
                    <div key={idx} className="bg-[#08080A] border border-[#181818] rounded-[1.5rem] p-6 shadow-[0_0_20px_rgba(249,115,22,0.03)]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black text-white">{drive.company_name}</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[#F97316] mt-1">{drive.role}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black rounded-full">High Readiness</span>
                        </div>
                        <p className="text-xs text-[#555] font-semibold mb-6">Deadline: {drive.deadline || 'Ongoing'}</p>
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
