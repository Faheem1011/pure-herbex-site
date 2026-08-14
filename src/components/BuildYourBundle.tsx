import React, { useState } from 'react';
import { Sparkles, Check, Plus, Trash2, ShoppingBag, Gift } from 'lucide-react';
import { Product } from '../types';

interface BuildYourBundleProps {
  products: Product[];
  onAddCustomBundleToCart: (items: Product[], totalPrice: number) => void;
}

export const BuildYourBundle: React.FC<BuildYourBundleProps> = ({ products, onAddCustomBundleToCart }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const handleToggleProduct = (product: Product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      if (selectedProducts.length < 3) {
        setSelectedProducts([...selectedProducts, product]);
      }
    }
  };

  const rawTotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
  const isComplete = selectedProducts.length === 3;
  const discountedTotal = isComplete ? 1500 : rawTotal;
  const savings = rawTotal > 1500 ? rawTotal - 1500 : 300;

  const handleAddBundle = () => {
    if (isComplete) {
      onAddCustomBundleToCart(selectedProducts, discountedTotal);
    }
  };

  return (
    <section id="byog-section" className="py-16 bg-sun-sand-dark border-b-4 border-sun-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="badge-sticker text-sm uppercase tracking-wide">
            🎁 COMPLETE KIT BUNDLER
          </span>
          <h2 className="text-4xl sm:text-5xl font-black uppercase text-sun-dark tracking-tight">
            BUILD YOUR <span className="text-amber-600">GLOW</span> KIT
          </h2>
          <p className="text-lg text-sun-brown font-medium">
            Select all 3 botanical essentials (Face Pack + Night Toner + Rose Water) to unlock the complete kit for only <strong className="text-emerald-800 font-black">Rs. 1,500</strong> (Discounted from Rs. 1,800)!
          </p>

          {/* Progress Tracker */}
          <div className="bg-sun-cream border-2 border-sun-dark p-4 rounded-2xl shadow-retro max-w-lg mx-auto mt-6">
            <div className="flex justify-between items-center text-sm font-extrabold text-sun-dark mb-2">
              <span>PROGRESS: {selectedProducts.length}/3 ITEMS SELECTED</span>
              {isComplete ? (
                <span className="text-emerald-600 flex items-center gap-1 font-black">
                  <Check className="w-4 h-4" /> COMPLETE KIT DISCOUNT UNLOCKED (RS. 1,500)!
                </span>
              ) : (
                <span className="text-amber-600">
                  Select {3 - selectedProducts.length} more item{3 - selectedProducts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="w-full bg-sun-sand h-4 rounded-full border-2 border-sun-dark overflow-hidden">
              <div 
                className="bg-sun-yellow h-full transition-all duration-300 rounded-full"
                style={{ width: `${(selectedProducts.length / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Grid Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {products.filter(p => p.category !== 'kits').map((product) => {
            const isSelected = selectedProducts.some(p => p.id === product.id);
            return (
              <div 
                key={product.id}
                onClick={() => handleToggleProduct(product)}
                className={`cursor-pointer bg-sun-cream border-3 border-sun-dark rounded-2xl p-5 transition-all transform hover:-translate-y-1 relative shadow-retro ${
                  isSelected ? 'ring-4 ring-sun-yellow bg-amber-50' : ''
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-sun-dark shadow-retro-sm">
                    <Check className="w-5 h-5" />
                  </div>
                )}

                <div className="bg-sun-sand rounded-xl p-3 mb-4 border border-sun-dark/20 flex items-center justify-center aspect-square h-48 sm:h-52 w-full overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    width="200"
                    height="200"
                    decoding="async"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                    }}
                    className="max-h-full max-w-full h-auto w-auto object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-sun-brown uppercase tracking-wider">
                    {product.subtitle}
                  </span>
                  <h3 className="font-display font-bold text-lg text-sun-dark leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-2 border-t border-sun-sand-dark">
                    <span className="font-extrabold text-lg text-sun-dark">
                      Rs. {product.price.toLocaleString()}
                    </span>
                    <button 
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-full border-2 border-sun-dark transition-colors ${
                        isSelected 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-sun-yellow text-sun-dark hover:bg-amber-400'
                      }`}
                    >
                      {isSelected ? 'Remove' : '+ Add To Kit'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bundle Summary Bar */}
        <div className="bg-sun-cream border-4 border-sun-dark p-6 rounded-3xl shadow-retro-lg max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-sun-brown uppercase">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Complete 3-Piece Ritual • Flat Rs. 150 Delivery</span>
            </div>
            
            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-3xl font-black text-sun-dark">
                Rs. {discountedTotal.toLocaleString()}
              </span>
              {isComplete && (
                <>
                  <span className="text-lg text-amber-950/75 line-through font-extrabold">
                    Rs. 1,800
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-500">
                    SAVE RS. 300 (KIT DISCOUNT)
                  </span>
                </>
              )}
            </div>
          </div>

          <button 
            disabled={!isComplete}
            onClick={handleAddBundle}
            className={`w-full md:w-auto font-black text-lg px-8 py-4 rounded-full border-2 border-sun-dark transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider ${
              isComplete 
                ? 'bg-sun-yellow text-sun-dark hover:bg-amber-400 shadow-retro cursor-pointer' 
                : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>{isComplete ? 'Add Custom Kit To Cart' : `Select 3 Items to Unlock`}</span>
          </button>
        </div>

      </div>
    </section>
  );
};
