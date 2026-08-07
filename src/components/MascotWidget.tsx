import React, { useState, useEffect } from 'react';
import { Sparkles, X, MessageSquareHeart } from 'lucide-react';

export const MascotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleText, setBubbleText] = useState("Assalam-o-Alaikum! Ready to get your natural summer glow? ☀️");

  const quotes = [
    "Kovera says: 'Rose petals and Moringa are the secret to baby soft skin!' 🌹",
    "Glow Aisa Ke Dunya Dekhay! ✴️ 100% natural, freshly handmade.",
    "Did you know? Order today & Leopards Courier will deliver in 3-4 days! 🚚",
    "Build your own kit and save Rs. 300 instantly! 🎁",
    "No chemical garbage here. Only pure botanical goodness! 🌿"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setBubbleText(randomQuote);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden sm:flex items-end gap-3 pointer-events-none">
      
      {/* Dialogue Bubble */}
      <div className={`pointer-events-auto bg-sun-cream border-3 border-sun-dark p-4 rounded-2xl shadow-retro max-w-xs transition-all duration-300 transform origin-bottom-left ${
        isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}>
        <div className="relative space-y-2">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-3 -right-3 p-1 bg-sun-sand rounded-full border border-sun-dark text-xs"
          >
            ✕
          </button>
          <p className="text-xs font-black text-sun-dark leading-relaxed">
            {bubbleText}
          </p>
          <div className="pt-2 border-t border-sun-dark/15 flex flex-col gap-1.5">
            <a 
              href="https://wa.me/923206972422?text=Assalam-o-Alaikum%20Pure%20Herbex!%20I%20have%20a%20question."
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-1.5 px-3 rounded-full border border-sun-dark flex items-center justify-center gap-1 shadow-retro-sm"
            >
              💬 WhatsApp Line 1 (+92 320 6972422)
            </a>
            <a 
              href="https://wa.me/923086952333?text=Assalam-o-Alaikum%20Pure%20Herbex!%20I%20have%20a%20question."
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black py-1.5 px-3 rounded-full border border-sun-dark flex items-center justify-center gap-1 shadow-retro-sm"
            >
              💬 WhatsApp Line 2 (+92 308 6952333)
            </a>
          </div>
        </div>
      </div>

      {/* Mascot Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative group bg-sun-yellow border-3 border-sun-dark p-1.5 rounded-full shadow-retro hover:bg-amber-400 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
        title="Chat with Kovera"
      >
        <img 
          src="/images/mascot_glow_koala.png" 
          alt="Kovera Mascot" 
          className="w-14 h-14 rounded-full border-2 border-sun-dark object-cover"
        />
        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border border-sun-dark shadow-retro-sm text-[10px] animate-pulse">
          <Sparkles className="w-3 h-3" />
        </div>
      </button>

    </div>
  );
};
export default MascotWidget;
