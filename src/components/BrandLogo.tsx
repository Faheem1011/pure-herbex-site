import React from 'react';

interface BrandLogoProps {
  className?: string;
  light?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-10 w-auto', light = false }) => {
  return (
    <div className={`flex items-center gap-3 inline-flex ${className}`}>
      {/* High-Definition Golden Sunburst Botanical Emblem */}
      <svg 
        viewBox="0 0 100 100" 
        className="h-10 w-10 flex-shrink-0 drop-shadow-sm" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sunburst background circle */}
        <circle cx="50" cy="50" r="46" fill="#FBBF24" stroke="#2C1E14" strokeWidth="4" />
        <circle cx="50" cy="50" r="38" fill="#FFFBEB" stroke="#2C1E14" strokeWidth="2.5" />
        
        {/* Botanical Lotus / Leaf Icon */}
        <path 
          d="M50 20C42 32 32 44 50 78C68 44 58 32 50 20Z" 
          fill="#15803D" 
          stroke="#2C1E14" 
          strokeWidth="3" 
          strokeLinejoin="round" 
        />
        <path 
          d="M50 78C32 64 20 48 30 36C40 38 46 48 50 78Z" 
          fill="#047857" 
          stroke="#2C1E14" 
          strokeWidth="2.5" 
          strokeLinejoin="round" 
        />
        <path 
          d="M50 78C68 64 80 48 70 36C60 38 54 48 50 78Z" 
          fill="#10B981" 
          stroke="#2C1E14" 
          strokeWidth="2.5" 
          strokeLinejoin="round" 
        />
        <circle cx="50" cy="46" r="4" fill="#F59E0B" stroke="#2C1E14" strokeWidth="1.5" />
      </svg>

      {/* Crisp Typography */}
      <div className="flex flex-col text-left leading-none">
        <span className={`font-display font-black tracking-tight uppercase text-2xl ${light ? 'text-sun-cream' : 'text-sun-dark'}`}>
          KOVERIA<span className="text-amber-600">GLOW</span>
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${light ? 'text-sun-yellow' : 'text-amber-900'}`}>
          by Pure Herbex
        </span>
      </div>
    </div>
  );
};
