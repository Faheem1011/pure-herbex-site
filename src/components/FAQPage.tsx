import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, Truck, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'products' | 'shipping' | 'usage';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'products',
    question: 'Are Pure Herbex Koveria Glow products 100% natural and organic?',
    answer: 'Yes! All Koveria Glow products are handcrafted in small artisanal batches using 100% pure organic rose petals, moringa leaf extract, organic Arabica coffee, pure Multani mitti, and steam-distilled hydrosols without synthetic parabens, sulfates, or artificial fragrances.'
  },
  {
    id: 'faq-2',
    category: 'products',
    question: 'What skin types is Koveria Glow suitable for?',
    answer: 'Koveria Glow is formulated for all skin types, including sensitive, oily, acne-prone, and sun-stressed skin. Because our products use pure plant botanicals and balanced pH hydrosols, they soothe irritation without clogging pores.'
  },
  {
    id: 'faq-3',
    category: 'shipping',
    question: 'What are the delivery charges and shipping times across Pakistan?',
    answer: 'We offer Flat Rs. 150 Nationwide Cash on Delivery (COD) shipping across all cities and towns in Pakistan via Leopards Courier & Run Couriers. Standard delivery takes 3 to 4 business days.'
  },
  {
    id: 'faq-4',
    category: 'shipping',
    question: 'How do I track my order status?',
    answer: 'Once your order is booked, you receive a courier tracking ID. You can track your parcel live anytime by clicking "Track Order" in the top navigation header or footer.'
  },
  {
    id: 'faq-5',
    category: 'usage',
    question: 'How often should I use the Koveria Glow Face Pack?',
    answer: 'We recommend using the Face Pack 2 to 3 times a week. Mix 1 to 2 spoonfuls with Pure Rose Water or Hydrating Aloe Toner, leave on for 15 minutes, and rinse gently with cool water.'
  },
  {
    id: 'faq-6',
    category: 'usage',
    question: 'What is the shelf life of handcrafted artisanal products?',
    answer: 'Because our powders are 100% dry and water-free, they have a shelf life of 12 months when stored in a cool, dry place. Hydrosols and toners have a shelf life of 9 to 12 months.'
  }
];

interface FAQPageProps {
  onNavigate: (route: string) => void;
  onOpenTrackOrder: () => void;
}

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigate, onOpenTrackOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = FAQ_DATA.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'all' || faq.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-sun-sand min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header Hero */}
        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-8 sm:p-12 shadow-retro-lg text-center space-y-4">
          <div className="inline-flex items-center gap-2 badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black px-4 py-1.5 rounded-full">
            <HelpCircle className="w-4 h-4" /> KNOWLEDGE BASE & FREQUENTLY ASKED QUESTIONS
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-sun-dark">
            How Can We <span className="text-amber-700">Help You?</span>
          </h1>

          <p className="text-sm sm:text-base font-medium text-sun-brown max-w-2xl mx-auto">
            Find answers to common questions regarding ingredients, application rituals, Cash on Delivery, and shipping tracking.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-lg mx-auto space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search questions (e.g. delivery, ingredients, face pack)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-sun-sand border-3 border-sun-dark rounded-full px-5 py-3 pl-11 text-sm font-bold text-sun-dark placeholder-sun-dark/60 focus:outline-none focus:ring-2 focus:ring-sun-yellow shadow-retro-sm"
              />
              <Search className="w-5 h-5 text-sun-dark absolute left-4 top-3.5" />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => setSelectedCat('all')}
                className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border-2 border-sun-dark ${selectedCat === 'all' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-cream text-sun-dark/80'}`}
              >
                All Questions
              </button>
              <button 
                onClick={() => setSelectedCat('products')}
                className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border-2 border-sun-dark ${selectedCat === 'products' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-cream text-sun-dark/80'}`}
              >
                Products & Ingredients
              </button>
              <button 
                onClick={() => setSelectedCat('shipping')}
                className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border-2 border-sun-dark ${selectedCat === 'shipping' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-cream text-sun-dark/80'}`}
              >
                Shipping & COD
              </button>
              <button 
                onClick={() => setSelectedCat('usage')}
                className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border-2 border-sun-dark ${selectedCat === 'usage' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-cream text-sun-dark/80'}`}
              >
                Usage Rituals
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Accordions */}
        <div className="space-y-4">
          {filteredFaqs.map(faq => {
            const isOpen = openFaqId === faq.id;
            return (
              <div 
                key={faq.id} 
                className="bg-sun-cream border-3 border-sun-dark rounded-2xl overflow-hidden shadow-retro-sm transition-all"
              >
                <button 
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left font-display font-black text-lg text-sun-dark flex items-center justify-between gap-4 hover:bg-amber-100/50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-sun-yellow border border-sun-dark flex items-center justify-center text-xs shrink-0">
                      ?
                    </span>
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-700' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 text-sm font-medium text-sun-dark/90 leading-relaxed border-t border-sun-dark/10 bg-sun-sand/40">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Buttons Box */}
        <div className="bg-sun-yellow p-6 rounded-3xl border-4 border-sun-dark shadow-retro text-center space-y-4">
          <h3 className="font-display font-black text-xl uppercase text-sun-dark">
            Still Have Questions?
          </h3>
          <p className="text-xs font-bold text-sun-brown">
            Our botanical beauty specialists are available 7 days a week to guide your skincare routine.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button 
              onClick={() => onNavigate('contact')}
              className="bg-sun-dark text-sun-yellow font-black px-6 py-2.5 rounded-full border-2 border-sun-dark uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-amber-900"
            >
              <MessageCircle className="w-4 h-4" /> Contact Customer Support
            </button>
            <button 
              onClick={onOpenTrackOrder}
              className="bg-sun-cream text-sun-dark font-black px-6 py-2.5 rounded-full border-2 border-sun-dark uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-amber-100"
            >
              <Truck className="w-4 h-4" /> Track Existing Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
