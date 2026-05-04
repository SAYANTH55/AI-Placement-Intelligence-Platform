export default function ScoreRing({ score = 0, size = 120, strokeWidth = 10, confidence = 0.5, uncertainty = 'medium' }) {
    // Cap score at 100 to prevent display issues
    const cappedScore = Math.min(Math.max(score, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (cappedScore / 100) * circumference;

    let color = '#22C55E'; // green
    let label = 'Strong';
    let labelColor = '#16A34A';
    if (cappedScore < 50) { color = '#EF4444'; label = 'Needs Work'; labelColor = '#DC2626'; }
    else if (cappedScore < 75) { color = '#F97316'; label = 'Good'; labelColor = '#EA580C'; }

    // Uncertainty styling
    const uncertaintyColors = {
        'low': '#4ade80',
        'medium': '#fbbf24',
        'high': '#f87171'
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#1E1E1E"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ 
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            filter: `drop-shadow(0 0 5px ${color}44)`
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white leading-none">{cappedScore}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Placement Score</span>
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-black uppercase tracking-tighter" style={{ color: labelColor }}>{label}</span>
                
                {/* Honesty Metrics */}
                <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-black/40 rounded-full border border-white/5">
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Confidence:</span>
                        <span className="text-[9px] text-white font-black">{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="w-[1px] h-2 bg-gray-700"></div>
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Uncertainty:</span>
                        <span className="text-[9px] font-black uppercase" style={{ color: uncertaintyColors[uncertainty] }}>{uncertainty}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
