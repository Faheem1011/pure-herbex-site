import React from 'react';
import { Star, CheckCircle, Instagram } from 'lucide-react';
import { REVIEWS } from '../data/reviews';

export const ReviewsSection: React.FC = () => {
  return (
    <section className="py-20 bg-sun-sand border-b-4 border-sun-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="badge-sticker text-xs uppercase tracking-wide">
            ⭐ THE GLOW CLUB
          </span>
          <h2 className="text-4xl sm:text-5xl font-black uppercase text-sun-dark tracking-tight">
            REAL PEOPLE, REAL <span className="text-sun-yellow bg-sun-dark px-3 py-1 rounded-xl">GLOW</span>
          </h2>
          <div className="flex justify-center items-center gap-2 text-amber-500 font-extrabold text-lg">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="text-sun-dark">4.9 / 5.0 Rating Across 1,200+ Verified Buyers</span>
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {REVIEWS.map((rev) => (
            <div 
              key={rev.id}
              className="bg-sun-cream border-3 border-sun-dark p-6 rounded-3xl shadow-retro space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-sun-brown opacity-80">{rev.date}</span>
                </div>

                <h3 className="font-display font-black text-lg text-sun-dark">
                  "{rev.title}"
                </h3>

                <p className="text-sm text-sun-dark opacity-90 leading-relaxed">
                  {rev.comment}
                </p>
              </div>

              <div className="pt-4 border-t border-sun-sand-dark flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-sun-dark flex items-center gap-1.5">
                    <span>{rev.author}</span>
                    {rev.verified && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-sun-brown">{rev.location}</div>
                </div>
                <span className="text-xs font-extrabold bg-sun-sand px-3 py-1 rounded-full border border-sun-dark">
                  {rev.productName}
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* Instagram Gallery Banner */}
        <div className="bg-sun-dark text-sun-cream p-8 sm:p-12 rounded-3xl border-4 border-sun-dark shadow-retro-lg text-center space-y-6">
          <Instagram className="w-12 h-12 mx-auto text-sun-yellow" />
          <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            TAG <span className="text-sun-yellow">#GLOWWITHHERBEX</span> TO BE FEATURED
          </h3>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-medium">
            Join over 25,000+ community members sharing their daily botanical radiance routine across Pakistan.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="aspect-square bg-sun-brown/40 rounded-2xl border-2 border-sun-cream/20 overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop" 
                alt="Koveria Glow Complete Kit Customer Review by Ayesha" 
                width="300" 
                height="300" 
                loading="lazy" 
                decoding="async" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608248597263-00079e96576d?q=80&w=1000&auto=format&fit=crop';
                }}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-sun-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs text-sun-cream">
                @ayesha_k
              </div>
            </div>
            <div className="aspect-square bg-sun-brown/40 rounded-2xl border-2 border-sun-cream/20 overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop" 
                alt="Pure Steam Distilled Rose Water Customer Review by Zainab" 
                width="300" 
                height="300" 
                loading="lazy" 
                decoding="async" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=1000&auto=format&fit=crop';
                }}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-sun-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs text-sun-cream">
                @zainab_m
              </div>
            </div>
            <div className="aspect-square bg-sun-brown/40 rounded-2xl border-2 border-sun-cream/20 overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop" 
                alt="Koveria Glow Hydrating Toner Customer Review by Bilal" 
                width="300" 
                height="300" 
                loading="lazy" 
                decoding="async" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1000&auto=format&fit=crop';
                }}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-sun-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs text-sun-cream">
                @bilal_r
              </div>
            </div>
            <div className="aspect-square bg-sun-brown/40 rounded-2xl border-2 border-sun-cream/20 overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop" 
                alt="Koveria Glow 3 Piece Bundle Customer Review by Fatima" 
                width="300" 
                height="300" 
                loading="lazy" 
                decoding="async" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608248597263-00079e96576d?q=80&w=1000&auto=format&fit=crop';
                }}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-sun-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs text-sun-cream">
                @fatima_h
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
