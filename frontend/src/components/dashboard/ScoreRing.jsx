export default function ScoreRing({ score = 0, size = 100, strokeWidth = 10 }) {
    // Cap score at 100 to prevent 107/100 display issues
    const cappedScore = Math.min(Math.max(score, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (cappedScore / 100) * circumference;

    let color = '#22C55E'; // green
    let label = 'Strong';
    let labelColor = '#16A34A';
    if (cappedScore < 50) { color = '#EF4444'; label = 'Needs Work'; labelColor = '#DC2626'; }
    else if (cappedScore < 75) { color = '#F97316'; label = 'Good'; labelColor = '#EA580C'; }

    return (
        <div className="flex flex-col items-center gap-1">
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
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white leading-none">{cappedScore}</span>
                    <span className="text-[10px] font-bold text-gray-400">/100</span>
                </div>
            </div>
            <span className="text-xs font-bold" style={{ color: labelColor }}>{label}</span>
        </div>
    );
}
