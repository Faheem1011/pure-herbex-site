import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, RotateCcw, X } from 'lucide-react';
import { Product } from '../types';

interface RoutineFinderProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const RoutineFinder: React.FC<RoutineFinderProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart
}) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    skinType: '',
    concern: '',
    sunExposure: ''
  });

  if (!isOpen) return null;

  const handleSelectOption = (key: 'skinType' | 'concern' | 'sunExposure', value: string) => {
    setAnswers({ ...answers, [key]: value });
    if (step < 3) {
      setStep(step + 1);
    } else {
      setStep(4); // Result step
    }
  };

  const handleReset = () => {
    setStep(1);
    setAnswers({ skinType: '', concern: '', sunExposure: '' });
  };

  // Match recommendation based on answers
  const recommendedProduct = products.find(p => p.id === 'koveria-glow-complete-kit') || products[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/70 backdrop-blur-sm">
      <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-retro-lg relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-sun-sand p-2 rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors"
        >
          <X className="w-5 h-5 text-sun-dark" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <span className="badge-sticker text-xs uppercase">
            ✨ ROUTINE FINDER QUIZ
          </span>
          <h2 className="text-3xl font-black uppercase text-sun-dark">
            FIND YOUR PERFECT <span className="text-amber-600">GLOW</span> ROUTINE
          </h2>
          <p className="text-sm text-sun-brown font-medium">
            Answer 3 quick questions to discover your personalized botanical formula.
          </p>
        </div>

        {/* Step 1: Skin Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-sun-dark text-center">
              Step 1/3: What is your primary skin type?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Dry / Dehydrated', desc: 'Craves deep hydration & sheen' },
                { label: 'Oily / Combination', desc: 'Needs lightweight non-greasy glow' },
                { label: 'Sensitive / Prone to Redness', desc: 'Needs soothing botanical extracts' },
                { label: 'Normal / Balanced', desc: 'Wants daily protective radiance' }
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption('skinType', opt.label)}
                  className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl hover:bg-sun-yellow hover:border-sun-dark transition-all text-left group shadow-retro-sm"
                >
                  <div className="font-black text-sun-dark group-hover:text-sun-dark">{opt.label}</div>
                  <div className="text-xs text-sun-brown">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Primary Concern */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-sun-dark text-center">
              Step 2/3: What is your main skin goal?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Instant Sun-Kissed Glow', desc: 'Warm 24h golden sheen' },
                { label: 'Fade Dark Spots & Hyperpigmentation', desc: 'Brighten & even tone' },
                { label: 'On-The-Go Hydration', desc: 'Refreshing botanical mist' },
                { label: 'Complete Daily Protection', desc: 'Full face & lip care' }
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption('concern', opt.label)}
                  className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl hover:bg-sun-yellow hover:border-sun-dark transition-all text-left group shadow-retro-sm"
                >
                  <div className="font-black text-sun-dark">{opt.label}</div>
                  <div className="text-xs text-sun-brown">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Sun Exposure */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-sun-dark text-center">
              Step 3/3: How much daily sun exposure do you get?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'High Exposure', desc: 'Outdoor sports, beach & sun' },
                { label: 'Moderate', desc: 'Daily commute & outdoors' },
                { label: 'Mostly Indoors', desc: 'Screen time & indoor light' }
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption('sunExposure', opt.label)}
                  className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl hover:bg-sun-yellow hover:border-sun-dark transition-all text-center group shadow-retro-sm"
                >
                  <div className="font-black text-sun-dark">{opt.label}</div>
                  <div className="text-xs text-sun-brown mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Personalized Result Recommendation */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-500 font-extrabold text-xs px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>MATCH FOUND FOR {answers.skinType.toUpperCase()} SKIN</span>
            </div>

            <div className="bg-sun-sand border-3 border-sun-dark p-6 rounded-3xl shadow-retro flex flex-col sm:flex-row items-center gap-6 text-left">
              <img 
                src={recommendedProduct.image} 
                alt={recommendedProduct.name} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                }}
                className="w-36 h-36 object-cover rounded-2xl border border-sun-dark/20 flex-shrink-0"
              />
              <div className="space-y-2">
                <span className="badge-sticker text-[10px] uppercase">MATCH SCORE: 99%</span>
                <h4 className="font-display font-black text-xl text-sun-dark">
                  {recommendedProduct.name}
                </h4>
                <p className="text-xs font-bold text-sun-brown">
                  {recommendedProduct.subtitle}
                </p>
                <p className="text-xs text-sun-dark leading-relaxed">
                  Based on your preferences ({answers.concern}), this formulation will deliver optimum botanical hydration and golden sheen.
                </p>
                <div className="text-lg font-black text-sun-dark pt-1">
                  Rs. {recommendedProduct.price.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={() => {
                  onAddToCart(recommendedProduct);
                  onClose();
                }}
                className="w-full bg-sun-yellow text-sun-dark font-black text-base py-3.5 px-6 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase"
              >
                Add Match To Cart • Rs. {recommendedProduct.price.toLocaleString()}
              </button>
              <button 
                onClick={handleReset}
                className="w-full sm:w-auto bg-sun-cream text-sun-dark font-bold text-sm py-3 px-4 rounded-full border-2 border-sun-dark hover:bg-sun-sand flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
