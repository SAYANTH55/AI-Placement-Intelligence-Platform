import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 animate-fade-in">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-orange-50 rounded-3xl mx-auto mb-6 flex items-center justify-center text-[#1B2A4A]">
                    <Compass size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-6xl font-black text-gray-900 mb-2 tracking-tight">404</h1>
                <h2 className="text-xl font-bold text-gray-700 mb-3">Page not found</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    This page doesn't exist or was moved. Let's get you back on track.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white font-bold px-7 py-3 rounded-full hover:bg-[#9ECCFA] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </button>
            </div>
        </div>
    );
}
