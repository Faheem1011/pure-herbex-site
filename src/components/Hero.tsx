import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Sun, Star } from 'lucide-react';
import { Product } from '../types';

interface HeroProps {
  flagshipProduct: Product;
  onAddToCart: (product: Product) => void;
  onOpenQuiz: () => void;
}

export const Hero: React.FC<HeroProps> = ({ flagshipProduct, onAddToCart, onOpenQuiz }) => {
  const handleScrollToShop = () => {
    const el = document.getElementById('shop-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-b from-sun-yellow to-amber-400 border-b-4 border-sun-dark overflow-hidden py-12 md:py-16">
      {/* Sun Ray Visual Details */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 opacity-40 rounded-full filter blur-3xl -z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-300 opacity-40 rounded-full filter blur-3xl -z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Mascot Greeting */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <div className="relative flex-shrink-0 group">
                <img 
                  src="/images/mascot_glow_koala.png" 
                  alt="Kovera Mascot" 
                  className="w-16 h-16 rounded-full border-3 border-sun-dark object-cover shadow-retro transform group-hover:rotate-6 transition-transform"
                />
                <div className="absolute -bottom-1 -right-1 bg-sun-yellow border-2 border-sun-dark p-1 rounded-full text-xs font-black shadow-retro-sm">
                  ✨
                </div>
              </div>

              {/* Dialogue Bubble */}
              <div className="bg-sun-cream border-3 border-sun-dark px-4 py-2.5 rounded-2xl shadow-retro relative transform rotate-1 max-w-sm">
                <p className="text-xs font-black text-sun-dark">
                  Kovera the Koala: <span className="text-amber-700">"Assalam-o-Alaikum! Ready to get that flawless, sun-kissed herbal radiance?" 🇵🇰</span>
                </p>
              </div>
            </div>

            {/* Headline & Tagline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight text-sun-dark leading-tight uppercase">
                GLOW LIKE <span className="text-sun-cream drop-shadow-[0_4px_0_#2C1E14]">SUMMER</span> ALL YEAR LONG
              </h1>
              <p className="font-handwriting text-2xl sm:text-3xl text-sun-dark font-bold">
                "Smells Like Pure Botanical Radiance®"
              </p>
            </div>

            <p className="text-sm sm:text-base text-sun-dark font-semibold max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Experience the magic of 100% home-made artisanal skincare. Freshly blended in small batches with premium organic ingredients and secret herbal elixirs to deliver flawless, luminous skin.
            </p>

            {/* Exact Benefits List */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 text-left bg-sun-cream/50 border-2 border-sun-dark p-4 rounded-2xl">
              {[
                '✴️ Brightens & even tones',
                '✴️ Prevents Acne',
                '✴️ Gentle Exfoliation',
                '✴️ Soothes & boost collagen',
                '✴️ Anti Aging',
                '✴️ Instant Glow & baby soft skin'
              ].map((benefit, i) => (
                <div key={i} className="text-xs sm:text-sm font-black text-sun-dark flex items-center gap-1.5">
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Complete Kit Deal Callout */}
            <div className="bg-sun-cream border-2 border-sun-dark p-3.5 rounded-2xl shadow-retro-sm text-left max-w-lg mx-auto lg:mx-0 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">🎁 LIMITED TIME OFFER</div>
                <div className="font-display font-black text-base text-sun-dark uppercase">Koveria Complete 3-Piece Kit</div>
                <p className="text-xs text-sun-brown font-semibold">Face Pack + Toner + Pure Rose Water</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 line-through text-xs font-bold mr-1.5">Rs. 1,800</span>
                <span className="text-xl font-black text-emerald-800">Rs. 1,500</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                onClick={() => onAddToCart(flagshipProduct)}
                className="w-full sm:w-auto bg-sun-dark text-sun-cream font-extrabold text-base px-8 py-4 rounded-full border-2 border-sun-dark hover:bg-amber-900 transition-all transform active:scale-95 shadow-retro-lg flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                <span>Add Complete Kit • Rs. 1,500</span>
                <ArrowRight className="w-5 h-5 text-sun-yellow" />
              </button>
              
              <button 
                onClick={onOpenQuiz}
                className="w-full sm:w-auto bg-sun-cream text-sun-dark font-extrabold text-sm px-6 py-4 rounded-full border-2 border-sun-dark hover:bg-sun-sand transition-all transform active:scale-95 shadow-retro flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Routine Finder Quiz</span>
              </button>
            </div>

            {/* Delivery Terms */}
            <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-6 text-xs font-black text-sun-dark opacity-90">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <span>Flat Rs. 150 Nationwide Shipping</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-900" />
                <span>3 to 4 Days Delivery</span>
              </div>
            </div>

          </div>

          {/* Right Hero Product Image Visual */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative group max-w-md w-full">
              
              <div className="bg-sun-cream border-4 border-sun-dark p-6 rounded-3xl shadow-retro-lg transform -rotate-1 group-hover:rotate-0 transition-transform duration-300 relative">
                
                <div className="absolute -top-4 -right-4 bg-sun-coral text-white font-extrabold text-xs px-4 py-2 rounded-full border-2 border-sun-dark shadow-retro-sm transform rotate-6">
                  20% OFF COMPLETE KIT
                </div>

                <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-2xl p-6 border-2 border-sun-dark flex items-center justify-center">
                  <img 
                    src="/images/glow-kit.png" 
                    alt="Koveria Glow Complete Kit" 
                    className="h-80 sm:h-96 object-contain filter drop-shadow-xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="mt-4 text-center space-y-1">
                  <div className="flex justify-center items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <span className="text-xs font-bold text-sun-dark ml-1">(5.0/5.0)</span>
                  </div>
                  <h3 className="font-display font-black text-xl text-sun-dark uppercase">COMPLETE KOVERIA GLOW KIT</h3>
                  <p className="text-xs font-bold text-sun-brown">Face Pack + Toner + Rose Water + Free Bag</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
