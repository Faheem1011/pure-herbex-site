import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, Truck, ShieldCheck, MapPin, User, Menu, X, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { getCurrentCustomer, CustomerUser } from '../services/customerAuth';

interface HeaderProps {
  cartCount: number;
  onNavigate: (route: string) => void;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenQuiz: () => void;
  onSelectCategory: (category: string) => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onNavigate,
  onOpenCart,
  onOpenTrackOrder,
  onOpenQuiz,
  onSelectCategory,
  onOpenAuthModal
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);

  useEffect(() => {
    setCustomer(getCurrentCustomer());
  }, []);

  const handleShopNav = (category: string) => {
    onSelectCategory(category);
    onNavigate('shop');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-sun-cream border-b-4 border-sun-dark shadow-sm">
      {/* Top Announcement Ticker */}
      <div className="bg-sun-yellow text-sun-dark overflow-hidden py-2 border-b-2 border-sun-dark font-extrabold text-xs sm:text-sm">
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
          <nav className="hidden lg:flex items-center gap-5 font-extrabold text-xs sm:text-sm uppercase tracking-wider text-sun-dark">
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
              <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Complete Kit
            </button>
            <button 
              onClick={() => { onNavigate('ingredients'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow text-emerald-800"
            >
              Ingredients
            </button>
            <button 
              onClick={() => { onNavigate('journal'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow text-amber-900"
            >
              Journal
            </button>
            <button 
              onClick={() => { onNavigate('story'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Story
            </button>
            <button 
              onClick={() => { onNavigate('faq'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              FAQ
            </button>
            <button 
              onClick={() => { onNavigate('contact'); setIsMobileMenuOpen(false); }} 
              className="hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-sun-yellow"
            >
              Contact
            </button>
          </nav>

          {/* Logo Center */}
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 group text-left">
              <BrandLogo className="transform group-hover:scale-105 transition-transform" />
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button 
              onClick={onOpenTrackOrder}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-sun-sand border-2 border-sun-dark px-3 py-1.5 rounded-full hover:bg-sun-yellow transition-colors shadow-retro-sm"
              title="Track Order"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Track</span>
            </button>

            {/* Customer Account Button */}
            <button 
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs font-black bg-sun-sand text-sun-dark border-2 border-sun-dark px-3 py-1.5 rounded-full hover:bg-sun-yellow transition-colors shadow-retro-sm"
              title="Customer Account & Wishlist"
            >
              <User className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden md:inline">
                {customer ? customer.fullName.split(' ')[0] : 'Account'}
              </span>
            </button>

            {/* Shopping Cart Button */}
            <button 
              onClick={onOpenCart}
              className="relative bg-sun-yellow text-sun-dark font-black border-2 border-sun-dark px-3.5 sm:px-4 py-2 rounded-full hover:bg-amber-400 transition-all transform active:scale-95 shadow-retro flex items-center gap-2 text-xs sm:text-sm"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">CART</span>
              <span className="bg-sun-dark text-sun-yellow text-xs px-2 py-0.5 rounded-full font-black">
                {cartCount}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-sun-sand border-2 border-sun-dark rounded-xl"
              aria-label="Toggle Mobile Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-sun-cream border-t-2 border-sun-dark p-5 space-y-2.5 font-black text-sm uppercase animate-fade-in shadow-retro max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-sun-dark/15">
            <button 
              onClick={() => handleShopNav('all')} 
              className="w-full text-left py-2.5 px-3 bg-sun-sand rounded-xl border border-sun-dark hover:bg-sun-yellow transition-colors text-xs font-black flex items-center justify-between"
            >
              <span>Shop All</span>
              <span>→</span>
            </button>
            <button 
              onClick={() => handleShopNav('kits')} 
              className="w-full text-left py-2.5 px-3 bg-sun-yellow text-sun-dark rounded-xl border border-sun-dark hover:bg-amber-400 transition-colors text-xs font-black flex items-center justify-between shadow-retro-sm"
            >
              <span>Complete Kit</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            </button>
          </div>

          <button 
            onClick={() => { onNavigate('journal'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between text-amber-900 font-black"
          >
            <span>🌿 Skincare Journal & Guides</span>
            <span className="text-xs bg-sun-yellow text-sun-dark px-2 py-0.5 rounded-full border border-sun-dark">NEW</span>
          </button>
          <button 
            onClick={() => { onNavigate('ingredients'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between text-emerald-800"
          >
            <span>🔬 Botanical Ingredients Glossary</span>
          </button>
          <button 
            onClick={() => { onNavigate('routine-finder'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between text-amber-800"
          >
            <span>✨ Routine Finder Quiz</span>
          </button>
          <button 
            onClick={() => { onNavigate('story'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between"
          >
            <span>📜 Trust The Glow (Brand Story)</span>
          </button>
          <button 
            onClick={() => { onNavigate('faq'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between"
          >
            <span>❓ Frequently Asked Questions</span>
          </button>
          <button 
            onClick={() => { onNavigate('creators'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between text-amber-800 font-black"
          >
            <span>✨ Creators Circle (15% Commission)</span>
            <span className="text-[10px] bg-sun-yellow text-sun-dark px-2 py-0.5 rounded-full border border-sun-dark font-black">NEW</span>
          </button>
          <button 
            onClick={() => { onNavigate('contact'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between"
          >
            <span>📞 Contact Customer Care</span>
          </button>
          <button 
            onClick={() => { onNavigate('policies'); setIsMobileMenuOpen(false); }} 
            className="w-full text-left py-2 px-3 rounded-xl hover:bg-sun-sand flex items-center justify-between text-xs text-sun-brown"
          >
            <span>🛡️ Shipping & COD Policies</span>
          </button>

          <div className="pt-3 border-t border-sun-dark/15 grid grid-cols-2 gap-2">
            <button 
              onClick={() => { onOpenTrackOrder(); setIsMobileMenuOpen(false); }} 
              className="py-2.5 px-3 bg-sun-sand text-sun-dark border-2 border-sun-dark rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-retro-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" /> Track Order
            </button>
            <button 
              onClick={() => { onOpenAuthModal(); setIsMobileMenuOpen(false); }} 
              className="py-2.5 px-3 bg-sun-sand text-sun-dark border-2 border-sun-dark rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-retro-sm"
            >
              <User className="w-3.5 h-3.5 text-emerald-800" /> Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
