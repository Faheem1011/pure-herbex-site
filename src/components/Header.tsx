import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Truck, ShieldCheck, MapPin, Lock, Menu, X } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onNavigate: (route: string) => void;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenQuiz: () => void;
  onSelectCategory: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onNavigate,
  onOpenCart,
  onOpenTrackOrder,
  onOpenQuiz,
  onSelectCategory
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleShopNav = (category: string) => {
    onSelectCategory(category);
    onNavigate('shop');
    setIsMobileMenuOpen(false);
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
              onClick={() => handleShopNav('all')} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Shop All
            </button>
            <button 
              onClick={() => handleShopNav('kits')} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow text-amber-700 font-black flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4 text-sun-yellow" /> Complete Kit (Rs. 1,500)
            </button>
            <button 
              onClick={() => { onNavigate('story'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Trust The Glow
            </button>
            <button 
              onClick={() => { onNavigate('routine-finder'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow text-emerald-700"
            >
              Routine Finder
            </button>
            <button 
              onClick={() => { onNavigate('policies'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Policies & Support
            </button>
          </nav>

          {/* Logo Center */}
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 group text-left">
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
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenTrackOrder}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-sun-sand border-2 border-sun-dark px-3 py-1.5 rounded-full hover:bg-sun-yellow transition-colors shadow-retro-sm"
              title="Track Order"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Track</span>
            </button>

            <button 
              onClick={() => onNavigate('admin')}
              className="hidden sm:flex items-center gap-1 text-xs font-black bg-amber-100 text-amber-900 border-2 border-sun-dark px-3 py-1.5 rounded-full hover:bg-sun-yellow transition-colors shadow-retro-sm"
              title="Admin Section"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
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

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-sun-sand border-2 border-sun-dark rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-sun-cream border-t-2 border-sun-dark p-4 space-y-3 font-black text-sm uppercase">
          <button onClick={() => handleShopNav('all')} className="block w-full text-left py-2 hover:text-amber-600">Shop All Products</button>
          <button onClick={() => handleShopNav('kits')} className="block w-full text-left py-2 text-amber-700">Complete Kit (Rs. 1,500)</button>
          <button onClick={() => { onNavigate('story'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Trust The Glow (Brand Story)</button>
          <button onClick={() => { onNavigate('routine-finder'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 text-emerald-700">Routine Finder Quiz</button>
          <button onClick={() => { onNavigate('policies'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Policies & Customer Care</button>
          <button onClick={() => { onOpenTrackOrder(); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 text-amber-800">Track Order (Leopards COD)</button>
          <button onClick={() => { onNavigate('admin'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 text-red-800 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Admin Portal Section
          </button>
        </div>
      )}
    </header>
  );
};

