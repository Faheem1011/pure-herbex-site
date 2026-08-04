import React, { useState } from 'react';
import { Star, ShoppingBag, Info, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onQuickView }) => {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-sun-cream border-3 border-sun-dark rounded-3xl p-5 shadow-retro transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
      
      {/* Badge sticker top left */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-10">
          <span className="badge-sticker text-xs font-black tracking-wider uppercase">
            {product.badge}
          </span>
        </div>
      )}

      {/* Product Image Container */}
      <div 
        onClick={() => onQuickView(product)}
        className="cursor-pointer bg-gradient-to-b from-amber-50 to-sun-sand rounded-2xl p-6 mb-4 border-2 border-sun-dark/10 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-100 transition-colors"
      >
        <img 
          src={product.image} 
          alt={product.name} 
          className="h-56 sm:h-64 object-contain filter drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
        />

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-3 right-3 bg-sun-cream text-sun-dark p-2 rounded-full border-2 border-sun-dark shadow-retro-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sun-yellow"
          title="Quick View Details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Content Info */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-amber-500 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
            <span className="text-xs font-bold text-sun-dark ml-1">
              {product.rating} ({product.reviewCount})
            </span>
          </div>

          <h3 
            onClick={() => onQuickView(product)}
            className="cursor-pointer font-display font-black text-xl text-sun-dark group-hover:text-amber-700 transition-colors leading-tight"
          >
            {product.name}
          </h3>

          <p className="text-xs font-bold text-sun-brown mt-1">
            {product.subtitle} • {product.size}
          </p>

          <p className="text-xs text-sun-dark opacity-85 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-sun-sand-dark flex items-center justify-between gap-2">
          <div>
            <span className="text-xl font-black text-sun-dark">
              Rs. {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-1.5 font-bold">
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button 
            onClick={handleAdd}
            className={`font-black text-xs px-4 py-2.5 rounded-full border-2 border-sun-dark transition-all transform active:scale-95 flex items-center gap-1.5 shadow-retro-sm uppercase ${
              added 
                ? 'bg-emerald-500 text-white' 
                : 'bg-sun-yellow text-sun-dark hover:bg-amber-400'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Add
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
