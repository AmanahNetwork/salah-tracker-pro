import React from 'react';

const Logo = ({ height = 60 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img 
        src="/prd.png" 
        alt="PRODUCTIVITY TRACKER" 
        style={{ 
          height: `${height}px`,
          // This adds a soft golden glow and sharpens the gold lines
          filter: 'drop-shadow(0px 0px 8px rgba(245, 158, 11, 0.4)) brightness(1.1)',
          transition: 'transform 0.3s ease'
        }} 
        // Small interactive touch: logo grows slightly when hovered
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      />
    </div>
  );
};

export default Logo;