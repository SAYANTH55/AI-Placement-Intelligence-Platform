import React from 'react';

const CornerGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] select-none">
      <div className="corner-glow glow-top-left"></div>
      <div className="corner-glow glow-top-right"></div>
      <div className="corner-glow glow-bottom-left"></div>
      <div className="corner-glow glow-bottom-right"></div>
    </div>
  );
};

export default CornerGlow;
