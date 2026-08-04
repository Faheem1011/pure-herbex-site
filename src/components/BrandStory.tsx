import React, { useState } from 'react';
import { Sun, Leaf, Shield, Heart, Award, Sparkles } from 'lucide-react';

export const BrandStory: React.FC = () => {
  const [activeIngredient, setActiveIngredient] = useState(0);

  const ingredients = [
    {
      title: 'Rose Petals Powder',
      latin: 'Rosa Centifolia Petal Powder',
      desc: 'Sourced from organic rose blossoms. Gently exfoliates, brightens, and softens skin texture while delivering an instant natural flush.',
      icon: '🌹'
    },
    {
      title: 'Moringa Powder',
      latin: 'Moringa Oleifera Leaf Powder',
      desc: 'Known as the "miracle leaf." Loaded with vitamin C, antioxidants, and anti-inflammatory nutrients that prevent acne and boost natural collagen.',
      icon: '🌿'
    },
    {
      title: 'Coffee',
      latin: 'Coffea Arabica Seed Powder',
      desc: 'Premium ground coffee beans. Invigorates circulation, exfoliates dead skin cells, targets puffiness, and provides anti-aging benefits.',
      icon: '☕'
    },
    {
      title: 'Multani Mitti',
      latin: 'Solum Fullonum (Fuller’s Earth)',
      desc: 'Traditional subcontinental clay. Deeply cleanses pores, absorbs excess oils, removes sun tans, and tightens skin.',
      icon: '✨'
    },
    {
      title: 'Pure Aloe Vera Gel',
      latin: 'Aloe Barbadensis Leaf Juice',
      desc: 'Infused inside our Toner to soothe skin irritation, deliver deep weightless hydration, and leaves skin baby soft.',
      icon: '🌱'
    },
    {
      title: 'Pure Rose Water',
      latin: '100% Steam-Distilled Hydrosol',
      desc: 'Traditional steam-distillation ensures zero artificial chemicals. Refreshes, cools, and acts as the perfect mixer for the Face Pack.',
      icon: '🌸'
    },
    {
      title: 'Secret Ingredients',
      latin: 'Proprietary Koveria Herbal Elixir',
      desc: 'Our special, handcrafted homemade extracts added to boost the face pack and toner efficacy, keeping the skin glowing all day.',
      icon: '🤫'
    }
  ];

  return (
    <section id="story-section" className="py-20 bg-sun-cream border-b-4 border-sun-dark relative overflow-hidden">
      
      {/* Decorative background sun */}
      <div className="absolute top-12 left-10 opacity-10 pointer-events-none">
        <Sun className="w-64 h-64 text-sun-yellow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Brand Story Box */}
        <div className="bg-sun-yellow border-4 border-sun-dark p-8 sm:p-12 rounded-3xl shadow-retro-lg mb-16 text-sun-dark">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            
            <span className="badge-sticker bg-sun-cream text-sun-dark text-sm uppercase tracking-wide">
              ☀️ OUR BOTANICAL ETHOS
            </span>

            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-tight">
              TRUST THE <span className="underline decoration-sun-dark decoration-wavy">GLOW</span>.
            </h2>

            <p className="font-handwriting text-3xl sm:text-4xl font-bold text-sun-brown">
              "When you craft skincare to protect the ones you love, you make 'em better."
            </p>

            <p className="text-lg sm:text-xl font-medium opacity-95 leading-relaxed max-w-3xl mx-auto">
              We started <strong>Pure Herbex</strong> with a simple mission: create pure, clinical-grade botanical skincare that protects and restores skin under the harsh sun, without toxic chemicals or fake synthetic dyes. We test every single formula on ourselves and our families. If we wouldn't use it on the ones we love most, we don't make it.
            </p>

            {/* 4 Core Value Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-center font-bold text-xs sm:text-sm uppercase">
              <div className="bg-sun-cream p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <Leaf className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <span>100% Vegan & Cruelty Free</span>
              </div>
              <div className="bg-sun-cream p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <Shield className="w-6 h-6 mx-auto mb-2 text-amber-700" />
                <span>Dermatologist Approved</span>
              </div>
              <div className="bg-sun-cream p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <Sun className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                <span>Reef & Sun Safe</span>
              </div>
              <div className="bg-sun-cream p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <Award className="w-6 h-6 mx-auto mb-2 text-amber-800" />
                <span>Paraben & Sulfate Free</span>
              </div>
            </div>

          </div>
        </div>

        {/* Interactive Botanical Ingredient Spotlight */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="badge-sticker text-xs uppercase tracking-wide">
            🌱 INGREDIENT TRANSPARENCY
          </span>
          <h3 className="text-3xl sm:text-4xl font-black uppercase text-sun-dark">
            WHAT’S INSIDE OUR <span className="text-amber-600">BOTANICAL BOTTLES</span>
          </h3>

          {/* Ingredient Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {ingredients.map((ing, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIngredient(idx)}
                className={`font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full border-2 border-sun-dark transition-all ${
                  activeIngredient === idx 
                    ? 'bg-sun-dark text-sun-yellow shadow-retro-sm' 
                    : 'bg-sun-sand text-sun-dark hover:bg-amber-100'
                }`}
              >
                {ing.icon} {ing.title}
              </button>
            ))}
          </div>

          {/* Active Ingredient Content Display Card */}
          <div className="bg-sun-sand border-3 border-sun-dark p-6 sm:p-8 rounded-3xl shadow-retro text-left mt-6 flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl sm:text-6xl bg-sun-yellow p-6 rounded-2xl border-2 border-sun-dark shadow-retro-sm flex-shrink-0">
              {ingredients[activeIngredient].icon}
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                INCI: {ingredients[activeIngredient].latin}
              </span>
              <h4 className="font-display font-black text-2xl text-sun-dark">
                {ingredients[activeIngredient].title}
              </h4>
              <p className="text-sm sm:text-base text-sun-brown font-medium leading-relaxed">
                {ingredients[activeIngredient].desc}
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
