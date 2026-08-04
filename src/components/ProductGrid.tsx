import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onQuickView
}) => {
  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'serums', label: 'Facial Serums' },
    { id: 'oils', label: 'Radiance Oils' },
    { id: 'mists', label: 'Hydrating Mists' },
    { id: 'bundles', label: 'Bundles & Kits' }
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <section id="shop-section" className="py-16 bg-sun-sand border-b-4 border-sun-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="badge-sticker text-xs uppercase tracking-wide">
            🌿 BOTANICAL SUN CARE COLLECTION
          </span>
          <h2 className="text-4xl sm:text-5xl font-black uppercase text-sun-dark tracking-tight">
            SHOP THE <span className="text-sun-yellow bg-sun-dark px-3 py-1 rounded-xl">GLOW</span> COLLECTION
          </h2>
          <p className="text-base text-sun-brown font-medium">
            Formulated for daily sun protection, instant skin radiance, and zero heavy grease.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button 
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`font-black text-sm uppercase px-6 py-3 rounded-full border-2 border-sun-dark transition-all transform active:scale-95 shadow-retro-sm ${
                  isActive 
                    ? 'bg-sun-yellow text-sun-dark shadow-retro' 
                    : 'bg-sun-cream text-sun-dark hover:bg-sun-sand-dark'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
