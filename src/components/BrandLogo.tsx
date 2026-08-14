import React from 'react';

interface BrandLogoProps {
  className?: string;
  light?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-10 w-auto', light = false }) => {
  return (
    <div className={`flex items-center gap-3 inline-flex ${className}`}>
      {/* Authentic Brand Emblem Image */}
      <img 
        src="/images/brand_logo.png" 
        alt="Pure Herbex Logo" 
        className="h-10 w-10 sm:h-11 sm:w-11 object-contain flex-shrink-0 drop-shadow-sm" 
        loading="eager"
        decoding="async"
      />

      {/* Crisp Typography */}
      <div className="flex flex-col text-left leading-none">
        <span className={`font-display font-black tracking-tight uppercase text-2xl sm:text-3xl ${light ? 'text-sun-cream' : 'text-sun-dark'}`}>
          KOVERIA<span className="text-amber-600">GLOW</span>
        </span>
        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest mt-0.5 ${light ? 'text-sun-yellow' : 'text-amber-900'}`}>
          by Pure Herbex
        </span>
      </div>
    </div>
  );
};
