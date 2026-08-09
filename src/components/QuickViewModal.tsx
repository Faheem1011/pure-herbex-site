import React from 'react';
import { Star, ShoppingBag, X, Check, ShieldCheck, Leaf } from 'lucide-react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/70 backdrop-blur-sm">
      <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-retro-lg relative max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-sun-sand p-2 rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors z-10"
        >
          <X className="w-5 h-5 text-sun-dark" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="bg-gradient-to-b from-amber-50 to-sun-sand p-6 rounded-2xl border-2 border-sun-dark flex items-center justify-center">
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-72 object-contain filter drop-shadow-lg"
            />
          </div>

          <div className="space-y-4">
            {product.badge && (
              <span className="badge-sticker text-xs font-black uppercase">
                {product.badge}
              </span>
            )}

            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <span className="text-xs font-bold text-sun-dark ml-1">{product.rating} ({product.reviewCount} Reviews)</span>
              </div>

              <h2 className="font-display font-black text-2xl text-sun-dark leading-tight">
                {product.name}
              </h2>
              <p className="text-xs font-bold text-sun-brown">{product.subtitle} • {product.size}</p>
            </div>

            <div className="text-2xl font-black text-sun-dark">
              Rs. {product.price.toLocaleString()}
              {product.originalPrice && (
                <span className="text-sm text-amber-950/75 line-through ml-2 font-extrabold">
                  Rs. {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-sm text-sun-dark leading-relaxed font-medium">
              {product.description}
            </p>

            {/* Benefits */}
            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-black uppercase text-sun-dark">Key Botanical Benefits:</h4>
              {product.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-bold text-sun-brown">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full bg-sun-yellow text-sun-dark font-black py-4 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-base flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add To Cart • Rs. {product.price.toLocaleString()}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
