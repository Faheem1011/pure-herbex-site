import React from 'react';
import { Sparkles, ShieldCheck, Heart, Mail, Instagram, Facebook, Youtube, Lock } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenTrackOrder: () => void;
  onOpenQuiz: () => void;
  onSelectCategory: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenTrackOrder, onOpenQuiz, onSelectCategory }) => {
  const handleCategoryNav = (cat: string) => {
    onSelectCategory(cat);
    onNavigate('shop');
  };

  return (
    <footer className="bg-sun-dark text-sun-cream border-t-4 border-sun-dark pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Newsletter Box */}
        <div className="bg-sun-yellow text-sun-dark p-8 sm:p-10 rounded-3xl border-4 border-sun-dark shadow-retro-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="badge-sticker bg-sun-cream text-sun-dark text-xs uppercase">
              💌 THE BUM & GLOW CLUB
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
              GET 15% OFF YOUR FIRST BOTANICAL ORDER
            </h3>
            <p className="text-sm font-medium text-sun-brown">
              Sign up for secret discount drops, sun safety tips, and new product releases.
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <input 
              type="email" 
              placeholder="Enter your email address..."
              required
              className="bg-sun-cream border-2 border-sun-dark rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sun-dark font-medium text-sun-dark min-w-[260px]"
            />
            <button 
              type="submit"
              className="bg-sun-dark text-sun-yellow font-black px-6 py-3 rounded-full border-2 border-sun-dark hover:bg-amber-900 transition-colors uppercase text-xs tracking-wider"
            >
              Join The Club
            </button>
          </form>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-b border-sun-cream/20 pb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 cursor-pointer bg-sun-cream/10 p-2.5 rounded-2xl border border-sun-cream/20 inline-flex" onClick={() => onNavigate('home')}>
              <BrandLogo />
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              Pure Herbex creates clean, clinical-grade botanical skincare and sun protection products crafted for radiant, healthy skin under the sun.
            </p>
            <div className="flex items-center gap-3 text-sun-yellow">
              <a href="#" aria-label="Follow Pure Herbex on Instagram" className="p-2 bg-sun-brown rounded-full hover:bg-sun-yellow hover:text-sun-dark transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" aria-label="Follow Pure Herbex on Facebook" className="p-2 bg-sun-brown rounded-full hover:bg-sun-yellow hover:text-sun-dark transition-colors"><Facebook className="w-4 h-4" /></a>
              <a href="#" aria-label="Follow Pure Herbex on YouTube" className="p-2 bg-sun-brown rounded-full hover:bg-sun-yellow hover:text-sun-dark transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-black text-sm uppercase text-sun-yellow tracking-wider mb-3">Discover Koveria</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-300">
              <li><button onClick={() => handleCategoryNav('all')} className="hover:text-sun-yellow">All 8 Products</button></li>
              <li><button onClick={() => onNavigate('ingredients')} className="hover:text-sun-yellow text-emerald-400">Botanical Actives Glossary</button></li>
              <li><button onClick={() => onNavigate('journal')} className="hover:text-sun-yellow text-amber-300">Skincare Radiance Journal</button></li>
              <li><button onClick={() => onNavigate('story')} className="hover:text-sun-yellow">Trust The Glow Story</button></li>
              <li><button onClick={() => handleCategoryNav('kits')} className="hover:text-sun-yellow">Flagship 3-Piece Kit</button></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-display font-black text-sm uppercase text-sun-yellow tracking-wider mb-3">Support & Help</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-300">
              <li><button onClick={onOpenTrackOrder} className="hover:text-sun-yellow text-amber-400">Track Order (Leopards COD)</button></li>
              <li><button onClick={() => onNavigate('faq')} className="hover:text-sun-yellow text-emerald-400">Ask Pure Herbex FAQ</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-sun-yellow">Contact Customer Support</button></li>
              <li><button onClick={onOpenQuiz} className="hover:text-sun-yellow text-amber-300">Routine Finder Quiz</button></li>
              <li><button onClick={() => onNavigate('policies')} className="hover:text-sun-yellow">Shipping & COD Policies</button></li>
            </ul>
          </div>

          {/* Guarantees & Internal Link */}
          <div className="space-y-3">
            <h4 className="font-display font-black text-sm uppercase text-sun-yellow tracking-wider">Our Promise</h4>
            <div className="bg-sun-brown p-3 rounded-2xl border border-sun-cream/20 text-xs text-gray-300 space-y-1 font-medium">
              <div className="font-black text-sun-cream flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-sun-yellow" /> Cash On Delivery
              </div>
              <p>Express 2-day delivery across all cities in Pakistan via Run Couriers.</p>
            </div>

            <button 
              onClick={() => onNavigate('admin')} 
              className="w-full mt-2 bg-amber-900/50 hover:bg-sun-yellow hover:text-sun-dark text-sun-cream text-xs font-bold py-2 px-3 rounded-xl border border-sun-cream/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal Login</span>
            </button>
          </div>

        </div>

        {/* Copyright & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-medium gap-4">
          <div>
            © {new Date().getFullYear()} Koveria Glow by Pure Herbex®. All Rights Reserved. Inspired by Sun Bum® design aesthetic.
          </div>
          <div className="flex gap-4">
            <button onClick={() => onNavigate('policies')} className="hover:underline">Privacy Policy</button>
            <button onClick={() => onNavigate('policies')} className="hover:underline">Terms of Service</button>
            <button onClick={() => onNavigate('policies')} className="hover:underline">COD Conditions</button>
          </div>
        </div>

      </div>
    </footer>
  );
};

