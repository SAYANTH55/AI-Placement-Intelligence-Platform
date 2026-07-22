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
    else if (cappedScore < 75) { color = '#1B2A4A'; label = 'Good'; labelColor = '#1B2A4A'; }

    // Uncertainty styling
    const uncertaintyColors = {
        'low': '#27500A',
        'medium': '#854F0B',
        'high': '#791F1F'
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
                        stroke="#C9C2AF"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span 
                        className="font-black text-[#1B2A4A] leading-none" 
                        style={{ fontSize: Math.max(size * 0.28, 14) }}
                    >
                        {cappedScore}
                    </span>
                    <span 
                        className="font-bold text-gray-500 uppercase tracking-tight text-center leading-tight mt-1" 
                        style={{ fontSize: Math.max(size * 0.09, 7) }}
                    >
                        Placement<br/>Score
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-black uppercase tracking-tighter" style={{ color: labelColor }}>{label}</span>
                
                {/* Honesty Metrics */}
                <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-[#F4EFE4] rounded-full border border-[#C9C2AF]">
                    <div className="flex items-center gap-1">
                        <span className="text-[13px] text-[#6B6B63] font-bold uppercase">Confidence:</span>
                        <span className="text-[13px] text-[#1B2A4A] font-black">{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="w-[1px] h-3 bg-[#C9C2AF]"></div>
                    <div className="flex items-center gap-1">
                        <span className="text-[13px] text-[#6B6B63] font-bold uppercase">Uncertainty:</span>
                        <span className="text-[13px] font-black uppercase" style={{ color: uncertaintyColors[uncertainty] }}>{uncertainty}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
