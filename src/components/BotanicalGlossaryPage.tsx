import React, { useState, useMemo } from 'react';
import { Search, Sparkles, BookOpen, ShieldCheck, ArrowRight, Leaf } from 'lucide-react';
import { INGREDIENTS_DATA } from '../data/ingredients';
import { PRODUCTS } from '../data/products';

interface BotanicalGlossaryPageProps {
  onNavigate: (route: string, productId?: string) => void;
}

export const BotanicalGlossaryPage: React.FC<BotanicalGlossaryPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => ['all', ...Array.from(new Set(INGREDIENTS_DATA.map(i => i.category)))], []);

  const filteredIngredients = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return INGREDIENTS_DATA.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(lowerSearchTerm) ||
                            ing.scientificName.toLowerCase().includes(lowerSearchTerm) ||
                            ing.summary.toLowerCase().includes(lowerSearchTerm);
      const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="bg-sun-sand min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Hero Section */}
        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-8 sm:p-12 shadow-retro-lg text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black px-4 py-1.5 rounded-full">
            <BookOpen className="w-4 h-4" /> SCIENTIFIC BOTANICAL ENCYCLOPEDIA
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-sun-dark">
            Pure Herbex <span className="text-amber-700">Botanical Glossary</span>
          </h1>

          <p className="text-base sm:text-lg font-medium text-sun-brown max-w-3xl mx-auto leading-relaxed">
            Explore the clinical science, ancient origin, and dermatological efficacy behind every organic herb, cold-pressed seed oil, and steam-distilled hydrosol crafted into Koveria Glow.
          </p>

          {/* Search Bar & Category Filters */}
          <div className="pt-6 max-w-xl mx-auto space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search ingredients (e.g., Moringa, Rose, Caffeine)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-sun-sand border-3 border-sun-dark rounded-full px-5 py-3.5 pl-12 text-sm font-bold text-sun-dark placeholder-sun-dark/60 focus:outline-none focus:ring-2 focus:ring-sun-yellow shadow-retro-sm"
              />
              <Search className="w-5 h-5 text-sun-dark absolute left-4 top-4" />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-full border-2 border-sun-dark transition-all ${
                    selectedCategory === cat
                      ? 'bg-sun-yellow text-sun-dark shadow-retro-sm'
                      : 'bg-sun-cream text-sun-dark/80 hover:bg-amber-100'
                  }`}
                >
                  {cat === 'all' ? 'All Botanical Actives' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredIngredients.map((ing) => (
            <article key={ing.id} className="bg-sun-cream border-3 border-sun-dark rounded-3xl p-6 shadow-retro flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-sun-yellow/40 px-3 py-1 rounded-full border border-sun-dark/20 inline-block mb-2">
                      {ing.category}
                    </span>
                    <h2 className="font-display font-black text-2xl text-sun-dark">
                      {ing.name}
                    </h2>
                    <p className="text-xs font-bold text-amber-900 italic">
                      INCI: {ing.scientificName}
                    </p>
                  </div>
                  <div className="p-3 bg-sun-sand rounded-2xl border-2 border-sun-dark shrink-0">
                    <Leaf className="w-6 h-6 text-emerald-700" />
                  </div>
                </div>

                <div className="bg-sun-sand/60 p-3.5 rounded-2xl border border-sun-dark/10 text-xs font-bold text-sun-dark">
                  <span className="text-amber-800 uppercase font-black block mb-0.5">🌱 Origin & Harvesting:</span>
                  {ing.origin}
                </div>

                <p className="text-sm font-medium text-sun-dark/90 leading-relaxed">
                  {ing.summary}
                </p>

                {/* Key Benefits List */}
                <div className="space-y-2">
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-sun-dark flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sun-yellow" /> Key Clinical Benefits
                  </h4>
                  <ul className="grid grid-cols-1 gap-1.5 text-xs font-bold text-sun-brown">
                    {ing.keyBenefits.map((b, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sun-yellow shrink-0"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Scientific Mechanism */}
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <span className="font-black uppercase text-amber-950 block mb-0.5">🔬 Bio-Active Mechanism:</span>
                  {ing.scientificMechanism}
                </div>
              </div>

              {/* Related Products Footer inside Card */}
              <div className="pt-4 border-t border-sun-dark/15 space-y-2">
                <span className="text-xs font-black uppercase text-sun-dark block">Found in Products:</span>
                <div className="flex flex-wrap gap-2">
                  {ing.relatedProductIds.map(prodId => {
                    const prod = PRODUCTS.find(p => p.id === prodId);
                    if (!prod) return null;
                    return (
                      <button 
                        key={prodId}
                        onClick={() => onNavigate('product', prodId)}
                        className="text-xs font-bold bg-sun-yellow/30 hover:bg-sun-yellow text-sun-dark px-3 py-1.5 rounded-full border border-sun-dark flex items-center gap-1 transition-colors"
                      >
                        {prod.name} <ArrowRight className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              </div>

            </article>
          ))}
        </div>

        {/* CTA Bottom Banner */}
        <div className="bg-sun-dark text-sun-cream p-8 rounded-3xl border-4 border-sun-dark text-center space-y-4 shadow-retro-lg">
          <h3 className="font-display font-black text-2xl sm:text-3xl uppercase text-sun-yellow">
            Experience Pure Botanical Efficacy
          </h3>
          <p className="text-sm text-gray-300 max-w-xl mx-auto">
            All ingredients are freshly blended into small-batch artisanal skincare rituals. Start your routine today.
          </p>
          <button 
            onClick={() => onNavigate('shop')}
            className="bg-sun-yellow text-sun-dark font-black px-8 py-3.5 rounded-full border-2 border-sun-dark hover:bg-amber-400 uppercase text-xs tracking-wider shadow-retro-sm transition-all transform hover:scale-105"
          >
            Explore Complete Catalog
          </button>
        </div>

      </div>
    </div>
  );
};
