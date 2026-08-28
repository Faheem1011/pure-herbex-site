import React from 'react';
import { Truck, ShieldCheck, HelpCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PoliciesPageProps {
  onBack: () => void;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ onBack }) => {
  return (
    <div className="bg-sun-sand min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase text-sun-dark hover:text-amber-700 bg-sun-cream px-4 py-2 rounded-full border-2 border-sun-dark shadow-retro-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>

        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-8 sm:p-12 shadow-retro-lg space-y-10">
          <div className="text-center space-y-2 border-b-4 border-sun-dark pb-8">
            <span className="badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase">
              PURE HERBEX POLICIES & CUSTOMER CARE
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-sun-dark uppercase tracking-tight">
              SHIPPING, COD & SUPPORT GUIDE
            </h1>
            <p className="text-sm font-bold text-sun-brown max-w-2xl mx-auto">
              Everything you need to know about our nationwide delivery across Pakistan via Run Couriers / Leopards COD, return policies, and product FAQs.
            </p>
          </div>

          {/* Policy 1: Shipping & COD */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sun-yellow text-sun-dark rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <Truck className="w-6 h-6" />
              </div>
              <h2 className="font-display font-black text-xl text-sun-dark uppercase">
                1. Cash On Delivery (COD) & Shipping Terms
              </h2>
            </div>
            <div className="bg-sun-sand p-6 rounded-2xl border-2 border-sun-dark space-y-3 text-xs font-medium text-sun-dark leading-relaxed">
              <p>
                <strong>Flat Rate Shipping:</strong> We charge a flat nationwide delivery fee of <strong>Rs. 150</strong> on all orders within Pakistan regardless of parcel size or weight.
              </p>
              <p>
                <strong>Delivery Partner:</strong> All orders are dispatched via our official courier service integration with <strong>Run Couriers (Leopards COD)</strong>.
              </p>
              <p>
                <strong>Delivery Timeline:</strong> Orders are typically delivered within <strong>3 to 4 working days</strong> to all major cities in Pakistan (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Okara, etc.).
              </p>
              <p>
                <strong>Order Tracking:</strong> You will receive a unique Leopards tracking ID upon booking. You can track your parcel anytime directly on our website using the <strong>Track Order</strong> feature.
              </p>
            </div>
          </div>

          {/* Policy 2: Returns & Exchanges */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h2 className="font-display font-black text-xl text-sun-dark uppercase">
                2. 2-Day Return & Refund Policy
              </h2>
            </div>
            <div className="bg-sun-sand p-6 rounded-2xl border-2 border-sun-dark space-y-3 text-xs font-medium text-sun-dark leading-relaxed">
              <p>
                We offer a transparent <strong>2-Day Return & Refund Policy</strong> from the date your parcel is delivered by Leopards Courier.
              </p>
              <p>
                <strong>Eligibility Criteria:</strong> To qualify for a return or full refund, the parcel must be <strong>completely unused, undamaged, and unopened with all seals intact</strong> in its original packaging.
              </p>
              <p>
                To initiate a return or claim within 2 days of delivery, please message our support desk via WhatsApp or email <strong>admin@pureherbex.com</strong> with your Tracking Number and photos of the sealed, intact parcel.
              </p>
            </div>
          </div>

          {/* Policy 3: Frequently Asked Questions (FAQ) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl border-2 border-sun-dark shadow-retro-sm">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="font-display font-black text-xl text-sun-dark uppercase">
                3. Frequently Asked Questions (FAQ)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-sun-sand p-5 rounded-2xl border-2 border-sun-dark space-y-2">
                <h3 className="font-black text-xs uppercase text-sun-dark flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Are Pure Herbex products suitable for sensitive skin?
                </h3>
                <p className="text-xs font-medium text-sun-brown">
                  Yes! All Koveria Glow products are 100% natural, freshly handcrafted with pure rose petals, moringa, organic aloe vera, and steam-distilled hydrosols without harsh chemicals or artificial colors.
                </p>
              </div>

              <div className="bg-sun-sand p-5 rounded-2xl border-2 border-sun-dark space-y-2">
                <h3 className="font-black text-xs uppercase text-sun-dark flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> How do I mix the Koveria Glow Face Pack?
                </h3>
                <p className="text-xs font-medium text-sun-brown">
                  Mix 1-2 spoonfuls of the herbal powder with our Pure Rose Water or Hydrating Toner (or plain yogurt/milk) to create a smooth paste. Apply for 15 minutes and rinse with lukewarm water.
                </p>
              </div>

              <div className="bg-sun-sand p-5 rounded-2xl border-2 border-sun-dark space-y-2">
                <h3 className="font-black text-xs uppercase text-sun-dark flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> How long does a 3-piece kit last?
                </h3>
                <p className="text-xs font-medium text-sun-brown">
                  When used 2-3 times per week, the complete 3-piece kit lasts approximately 4 to 6 weeks of continuous daily routine.
                </p>
              </div>

              <div className="bg-sun-sand p-5 rounded-2xl border-2 border-sun-dark space-y-2">
                <h3 className="font-black text-xs uppercase text-sun-dark flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> How do I pay on delivery?
                </h3>
                <p className="text-xs font-medium text-sun-brown">
                  You simply pay cash to the Leopards Courier rider when they deliver your parcel at your door. No advance payment required!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
