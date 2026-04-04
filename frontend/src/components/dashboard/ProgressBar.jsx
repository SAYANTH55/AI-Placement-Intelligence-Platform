import classNames from 'classnames';

export default function ProgressBar({ score }) {
  let barColor = 'bg-green-500';
  let textColor = 'text-green-600';
  let trackColor = 'bg-green-100';
  let label = 'Strong';

  if (score < 50) {
    barColor = 'bg-red-500';
    textColor = 'text-red-600';
    trackColor = 'bg-red-100';
    label = 'Needs Work';
  } else if (score < 75) {
    barColor = 'bg-orange-500';
    textColor = 'text-orange-600';
    trackColor = 'bg-orange-100';
    label = 'Good';
  }

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Readiness</span>
        <div className="flex items-baseline gap-1.5">
          <span className={classNames("text-2xl font-black tracking-tight leading-none", textColor)}>
            {score}
          </span>
          <span className="text-xs text-gray-400 font-semibold">/ 100</span>
        </div>
      </div>
      <div className={classNames("w-full rounded-full h-2 overflow-hidden", trackColor)}>
        <div
          className={classNames("h-2 rounded-full transition-all duration-1000 ease-out", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={classNames("text-xs font-semibold", textColor)}>{label}</span>
    </div>
  );
}
