import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Sun, Star, ShoppingBag, Eye, Check } from 'lucide-react';
import { Product } from '../types';

interface HeroProps {
  flagshipProduct: Product;
  onAddToCart: (product: Product) => void;
  onOpenQuiz: () => void;
  onViewDetails?: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({ flagshipProduct, onAddToCart, onOpenQuiz, onViewDetails }) => {
  const [added, setAdded] = useState(false);

  const handleCardAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(flagshipProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(flagshipProduct);
    }
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
                  width="64"
                  height="64"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/brand_logo.png';
                  }}
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
                <div className="text-[10px] font-black text-amber-950 uppercase tracking-widest">🎁 LIMITED TIME OFFER</div>
                <div className="font-display font-black text-base text-sun-dark uppercase">Koveria Glow Face Pack Kit</div>
                <p className="text-xs text-amber-950 font-bold">Face Pack + Night Toner + Rose Water</p>
              </div>
              <div className="text-right">
                <span className="text-amber-950/75 line-through text-xs font-extrabold mr-1.5">Rs. 1,800</span>
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
              
              <div 
                onClick={handleCardClick}
                className="bg-sun-cream border-4 border-sun-dark p-6 rounded-3xl shadow-retro-lg transform -rotate-1 group-hover:rotate-0 transition-all duration-300 relative cursor-pointer group-hover:shadow-2xl"
              >
                
                <div className="absolute -top-4 -right-4 bg-rose-900 text-white font-black text-xs px-4 py-2 rounded-full border-2 border-sun-dark shadow-retro-sm transform rotate-6 z-10">
                  SAVE RS. 300 (COMPLETE KIT)
                </div>

                <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-2xl p-2 border-2 border-sun-dark flex items-center justify-center relative overflow-hidden group-hover:bg-amber-100/80 transition-colors h-80 sm:h-96 w-full aspect-square">
                  <img 
                    src={flagshipProduct.image || "/images/glow-kit.png"} 
                    alt={flagshipProduct.name || "Koveria Glow Complete Kit"} 
                    width="400"
                    height="400"
                    decoding="async"
                    fetchPriority="high"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                    }}
                    className="h-full w-full object-contain p-3 filter drop-shadow-xl transform group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Hover Prompt Badge */}
                  <div className="absolute top-3 left-3 bg-sun-dark/80 text-sun-cream text-xs font-black px-3 py-1.5 rounded-full border border-sun-cream opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-md">
                    <Eye className="w-3.5 h-3.5 text-sun-yellow" />
                    <span>Click Image to View Details</span>
                  </div>
                </div>

                <div className="mt-4 text-center space-y-2">
                  <div className="flex justify-center items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <span className="text-xs font-bold text-sun-dark ml-1">({flagshipProduct.rating || '5.0'})</span>
                  </div>
                  <h2 className="font-display font-black text-xl text-sun-dark uppercase group-hover:text-amber-800 transition-colors">
                    {flagshipProduct.name || 'KOVERIA GLOW FACE PACK KIT'}
                  </h2>
                  <p className="text-xs font-bold text-amber-950">
                    {flagshipProduct.subtitle || 'Face Pack + Night Toner + Rose Water'}
                  </p>

                  {/* Price Tag & Direct Quick Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-emerald-800">
                        Rs. {flagshipProduct.price ? flagshipProduct.price.toLocaleString() : '1,500'}
                      </span>
                      {flagshipProduct.originalPrice && (
                        <span className="text-sm text-amber-950/75 line-through font-extrabold">
                          Rs. {flagshipProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleCardAddToCart}
                        className={`font-black text-xs py-3 px-3 rounded-full border-2 border-sun-dark transition-all transform active:scale-95 flex items-center justify-center gap-1.5 uppercase shadow-retro-sm ${
                          added 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-sun-yellow text-sun-dark hover:bg-amber-400'
                        }`}
                      >
                        {added ? (
                          <>
                            <Check className="w-4 h-4" /> Added ✓
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" /> Add to Cart
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
                        }}
                        className="font-black text-xs py-3 px-3 rounded-full border-2 border-sun-dark bg-sun-cream text-sun-dark hover:bg-sun-sand transition-all transform active:scale-95 flex items-center justify-center gap-1.5 uppercase shadow-retro-sm"
                      >
                        <Eye className="w-4 h-4 text-amber-700" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

