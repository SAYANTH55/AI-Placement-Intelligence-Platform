import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export const LogoIcon = ({ size = 40 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-sm"
  >
    <defs>
      <linearGradient id="hexGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E36B13" />
        <stop offset="50%" stopColor="#F6A32B" />
        <stop offset="100%" stopColor="#F3841A" />
      </linearGradient>
    </defs>
    
    {/* Hexagon Base */}
    <path 
      d="M50 5 L88.97 27.5 L88.97 72.5 L50 95 L11.03 72.5 L11.03 27.5 Z" 
      fill="url(#hexGradient)" 
    />
    
    {/* AI Spark / Neural Dots (Left Side) */}
    <g opacity="0.9">
       <circle cx="25" cy="35" r="3" fill="#FFFFFF" />
       <circle cx="18" cy="50" r="2" fill="#FFFFFF" opacity="0.7" />
       <circle cx="32" cy="22" r="2.5" fill="#FFFFFF" opacity="0.8" />
       <path d="M25 35 L18 50 M25 35 L32 22 M25 35 L42 40" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" strokeDasharray="2 2" />
    </g>

    {/* Person / Profile Icon (Center) */}
    <circle cx="50" cy="42" r="13" fill="#FFFFFF" />
    <path d="M28 80 C 28 62, 72 62, 72 80" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
    
    {/* Placement Success Checkmark (Bottom Right) */}
    <circle cx="75" cy="70" r="14" fill="#1A1A1A" />
    <path d="M68 70 L73 75 L82 63" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Logo = ({ 
  className = "", 
  gap = "gap-3", 
  primaryText = "text-xl", 
  secondaryText = "text-sm hidden md:block",
  iconSize = 40
}) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group flex items-center cursor-pointer hardware-accelerated ${gap} ${className}`}
    >
      <LogoIcon size={iconSize} />
      <div className="flex items-center gap-1.5">
        <span className={`font-semibold tracking-tight ${primaryText}`} style={{ fontFamily: 'Poppins, sans-serif', color: '#E36B13' }}>
          AI Placement
        </span>
        <span className={`font-medium ${secondaryText} transition-colors group-hover:opacity-100`} style={{ fontFamily: 'Inter, sans-serif', color: '#E36B13', opacity: 0.7 }}>
          Intelligence Platform
        </span>
      </div>
    </motion.div>
  );
};

export default Logo;
