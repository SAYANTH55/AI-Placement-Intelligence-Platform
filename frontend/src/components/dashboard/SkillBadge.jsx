import classNames from 'classnames';

export default function SkillBadge({ skill, type = 'detected' }) {
  return (
    <span 
      className={classNames(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-105 duration-300",
        {
          "bg-green-100 text-green-800 border border-green-200": type === 'detected',
          "bg-red-100 text-red-800 border border-red-200": type === 'missing',
          "bg-orange-100 text-orange-800 border border-orange-200": type === 'learning'
        }
      )}
    >
      {skill}
    </span>
  );
}
