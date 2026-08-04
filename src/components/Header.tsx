import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Truck, ShieldCheck, MapPin } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenQuiz: () => void;
  onSelectCategory: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenTrackOrder,
  onOpenQuiz,
  onSelectCategory
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (category: string) => {
    onSelectCategory(category);
    setIsMobileMenuOpen(false);
    const shopSection = document.getElementById('shop-section');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-sun-cream border-b-4 border-sun-dark shadow-sm">
      {/* Top Announcement Ticker */}
      <div className="bg-sun-yellow text-sun-dark overflow-hidden py-2 border-b-2 border-sun-dark font-bold text-xs sm:text-sm">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> FLAT RS. 150 NATIONWIDE DELIVERY ACROSS PAKISTAN (3-4 DAYS)
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> RUN COURIERS LEOPARDS COD SERVICE ACTIVE
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> 100% ARTISANAL FRESHLY HANDMADE WITH SECRET BOTANICALS
          </span>
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> FLAT RS. 150 NATIONWIDE DELIVERY ACROSS PAKISTAN (3-4 DAYS)
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> RUN COURIERS LEOPARDS COD SERVICE ACTIVE
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center gap-6 font-extrabold text-sm uppercase tracking-wider text-sun-dark">
            <button 
              onClick={() => handleNavClick('all')} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Shop All
            </button>
            <button 
              onClick={() => handleNavClick('kits')} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow text-amber-700 font-black flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4 text-sun-yellow" /> Complete Kit (Rs. 1,500)
            </button>
            <button 
              onClick={() => handleScrollTo('story-section')} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Trust The Glow
            </button>
            <button 
              onClick={onOpenQuiz} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow text-emerald-700"
            >
              Routine Finder
            </button>
          </nav>

          {/* Logo Center */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2 group">
              <img 
                src="/images/brand_logo.png" 
                alt="Pure Herbex Logo" 
                className="h-12 w-auto object-contain transform group-hover:scale-105 transition-transform" 
              />
              <div className="flex flex-col text-left">
                <span className="font-display font-black text-2xl tracking-tight text-sun-dark leading-none">
                  KOVERIA<span className="text-sun-yellow">GLOW</span>
                </span>
                <span className="text-[10px] font-black tracking-widest text-amber-800 uppercase">
                  by Pure Herbex
                </span>
              </div>
            </a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenTrackOrder}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-sun-sand border-2 border-sun-dark px-3 py-1.5 rounded-full hover:bg-sun-yellow transition-colors shadow-retro-sm"
              title="Track Order"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>

            <button 
              onClick={onOpenCart}
              className="relative bg-sun-yellow text-sun-dark font-black border-2 border-sun-dark px-4 py-2 rounded-full hover:bg-amber-400 transition-all transform active:scale-95 shadow-retro flex items-center gap-2 text-sm"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">CART</span>
              <span className="bg-sun-dark text-sun-yellow text-xs px-2 py-0.5 rounded-full font-black">
                {cartCount}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
