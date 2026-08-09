import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Truck, Star, ArrowLeft, ShoppingBag, CheckCircle, Heart, RefreshCw } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBack: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onBack }) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-sun-sand min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase text-sun-dark hover:text-amber-700 bg-sun-cream px-4 py-2 rounded-full border-2 border-sun-dark shadow-retro-sm mb-6 transition-all transform hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>

        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-10 shadow-retro-lg grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: Product Image */}
          <div className="space-y-4">
            <div className="relative bg-sun-sand rounded-2xl border-3 border-sun-dark p-3 overflow-hidden shadow-retro group flex items-center justify-center aspect-square w-full max-h-[420px]">
              {product.badge && (
                <span className="badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase absolute top-4 left-4 z-10">
                  {product.badge}
                </span>
              )}
              <img 
                src={product.image} 
                alt={`${product.name} - Pure Herbex Koveria Glow Botanical Skincare`} 
                title={`${product.name} - Artisanal Natural Ritual`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608248597263-00079e96576d?q=80&w=1000&auto=format&fit=crop';
                }}
                className="w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Quick Guarantees Box */}
            <div className="bg-sun-yellow/20 border-2 border-sun-dark rounded-2xl p-4 space-y-2 text-xs font-bold text-sun-dark">
              <div className="flex items-center gap-2 text-emerald-800">
                <Truck className="w-4 h-4 text-emerald-600" /> Flat Rs. 150 Express COD Delivery Across Pakistan (Run Couriers)
              </div>
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" /> 100% Artisanal Handmade Fresh Batch Guarantee
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-amber-800 bg-sun-yellow/40 inline-block px-3 py-1 rounded-full border border-sun-dark/30">
                {product.category.toUpperCase()} • {product.size}
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-sun-dark">
                {product.name}
              </h1>

              <p className="text-sm font-bold text-sun-brown italic">
                "{product.tagline}"
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-black text-sun-dark">
                  {product.rating} ({product.reviewCount} Verified Reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="font-display font-black text-3xl text-sun-dark">
                  Rs. {product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg font-extrabold text-amber-950/75 line-through">
                    Rs. {product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="badge-sticker bg-emerald-100 text-emerald-800 text-xs">
                    SAVE RS. {(product.originalPrice - product.price).toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-sun-dark/80 leading-relaxed pt-2 border-t border-sun-dark/10">
                {product.description}
              </p>
            </div>

            {/* Benefits & Ingredients Section */}
            <div className="space-y-4 pt-4 border-t-2 border-sun-dark/20">
              <div>
                <h3 className="font-display font-black text-xs uppercase tracking-wider text-sun-dark mb-2">Key Botanical Benefits</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-bold text-sun-brown">
                  {product.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {product.ingredients && product.ingredients.length > 0 && (
                <div>
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-sun-dark mb-1">Pure Ingredients</h3>
                  <p className="text-xs font-medium text-gray-700">
                    {product.ingredients.join(' • ')}
                  </p>
                </div>
              )}

              {product.usage && (
                <div className="bg-sun-sand p-3 rounded-xl border border-sun-dark/20">
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-sun-dark mb-1">How To Apply</h3>
                  <p className="text-xs font-medium text-sun-dark">{product.usage}</p>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-3 pt-4 border-t-2 border-sun-dark">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase text-sun-dark">Quantity:</span>
                <div className="flex items-center bg-sun-sand border-2 border-sun-dark rounded-full overflow-hidden">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-sm font-black text-sun-dark hover:bg-sun-yellow transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-xs font-black text-sun-dark">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-sm font-black text-sun-dark hover:bg-sun-yellow transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAdd}
                className="w-full bg-sun-yellow text-sun-dark font-black py-4 rounded-full border-3 border-sun-dark shadow-retro hover:bg-amber-400 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {added ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-700" />
                    <span>ADDED TO BAG!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>ADD {quantity} TO BAG • RS. {(product.price * quantity).toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
