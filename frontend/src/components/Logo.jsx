import React from 'react';
import { motion } from 'framer-motion';

/* Target/crosshair mark — gestures at placement matching */
export const LogoIcon = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Navy rounded square */}
    <rect width="32" height="32" rx="8" fill="#1B2A4A" />
    {/* Outer ring */}
    <circle cx="16" cy="16" r="7" stroke="white" strokeWidth="2" fill="none" />
    {/* Inner dot */}
    <circle cx="16" cy="16" r="2.5" fill="white" />
    {/* Cross-hairs */}
    <line x1="16" y1="7" x2="16" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="16" y1="22" x2="16" y2="25" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="7" y1="16" x2="10" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="22" y1="16" x2="25" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const Logo = ({
  className = '',
  gap = 'gap-3',
  primaryText = 'text-xl',
  secondaryText = 'text-sm hidden md:block',
  iconSize = 40
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group flex items-center cursor-pointer hardware-accelerated ${gap} ${className}`}
    >
      <LogoIcon size={iconSize} />
      <span
        className={`font-bold ${primaryText}`}
        style={{
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          letterSpacing: '0.01em',
          color: '#1B2A4A',
        }}
      >
        Job Mode
      </span>
    </motion.div>
  );
};

export default Logo;
