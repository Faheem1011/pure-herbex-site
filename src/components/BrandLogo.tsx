import React from 'react';

interface BrandLogoProps {
  className?: string;
  light?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-10 sm:h-12 w-auto', light = false }) => {
  return (
    <div className={`flex items-center gap-2.5 inline-flex ${className}`}>
      <img 
        src="/images/brand_logo.png" 
        alt="Koveria Glow by Pure Herbex" 
        className={`h-10 sm:h-12 w-auto object-contain max-w-[220px] filter drop-shadow-sm ${light ? 'brightness-105' : ''}`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
