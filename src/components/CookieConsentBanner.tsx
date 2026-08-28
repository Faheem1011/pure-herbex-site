import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, Settings, X, ChevronRight, Sparkles } from 'lucide-react';
import {
  getCookieConsent,
  hasUserRespondedToConsent,
  saveCookieConsent,
  CookieConsentPreferences
} from '../services/cookieManager';

interface CookieConsentBannerProps {
  onOpenPolicies?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPolicies }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  
  // Customizable preferences state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  useEffect(() => {
    // Show banner if user hasn't made a choice yet
    const hasConsented = hasUserRespondedToConsent();
    if (!hasConsented) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Listen for custom trigger to reopen cookie settings (e.g. from footer)
    const handleOpenSettings = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalyticsEnabled(current.analytics);
        setMarketingEnabled(current.marketing);
      }
      setIsCustomizeOpen(true);
      setIsVisible(true);
    };

    window.addEventListener('pureherbex_open_cookie_settings', handleOpenSettings);
    return () => window.removeEventListener('pureherbex_open_cookie_settings', handleOpenSettings);
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({
      essential: true,
      analytics: true,
      marketing: true
    });
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  const handleEssentialOnly = () => {
    saveCookieConsent({
      essential: true,
      analytics: false,
      marketing: false
    });
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent({
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled
    });
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Main Bottom Slide-Up Consent Banner */}
      {!isCustomizeOpen && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none animate-slide-up">
          <div className="max-w-5xl mx-auto bg-sun-cream border-4 border-sun-dark rounded-3xl p-5 sm:p-6 shadow-retro-lg pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-5 relative">
            
            {/* Left Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sun-yellow border-2 border-sun-dark flex items-center justify-center shrink-0 shadow-retro-sm">
                <Cookie className="w-6 h-6 text-sun-dark" />
              </div>

              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="badge-sticker bg-sun-yellow text-sun-dark text-[10px] uppercase font-black">
                    🍪 FRESH BOTANICAL COOKIES
                  </span>
                  <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Privacy Secure
                  </span>
                </div>

                <h3 className="font-display font-black text-base sm:text-lg text-sun-dark uppercase tracking-tight">
                  We value your privacy & smooth browsing
                </h3>

                <p className="text-xs sm:text-sm text-sun-brown font-medium max-w-2xl leading-relaxed">
                  Pure Herbex uses cookies to ensure instant page caching, remember your radiance bundle items, securely track your Leopards Courier orders, and offer tailored skincare insights.
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={() => setIsCustomizeOpen(true)}
                className="w-full sm:w-auto bg-sun-sand text-sun-dark font-black text-xs px-4 py-3 rounded-full border-2 border-sun-dark hover:bg-amber-100 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-retro-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>

              <button
                onClick={handleEssentialOnly}
                className="w-full sm:w-auto bg-sun-cream text-sun-dark font-black text-xs px-4 py-3 rounded-full border-2 border-sun-dark hover:bg-amber-50 transition-colors uppercase tracking-wider shadow-retro-sm"
              >
                Essential Only
              </button>

              <button
                onClick={handleAcceptAll}
                className="w-full sm:w-auto bg-sun-yellow text-sun-dark font-black text-xs px-6 py-3 rounded-full border-2 border-sun-dark hover:bg-amber-400 transition-all transform active:scale-95 uppercase tracking-wider shadow-retro flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Accept All</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Detailed Custom Preferences Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-retro-lg relative max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-sun-dark/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sun-yellow border-2 border-sun-dark flex items-center justify-center shadow-retro-sm">
                  <Settings className="w-5 h-5 text-sun-dark" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl uppercase tracking-tight text-sun-dark">
                    Cookie & Privacy Preferences
                  </h3>
                  <p className="text-xs font-bold text-sun-brown">
                    Select which categories of cookies you want enabled.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="bg-sun-sand p-2 rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors"
              >
                <X className="w-4 h-4 text-sun-dark" />
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
              
              {/* Essential Cookies (Locked) */}
              <div className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 space-y-2 shadow-retro-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-sm text-sun-dark uppercase">
                      1. Strictly Necessary Cookies
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Always Active
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-sun-brown font-medium leading-relaxed">
                  Required for core site features, such as your shopping cart, Leopards Courier tracking, checkout processing, and secure navigation. Cannot be deactivated.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 space-y-2 shadow-retro-sm">
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-sm text-sun-dark uppercase">
                    2. Analytics & Performance Cookies
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sun-dark border-2 border-sun-dark"></div>
                  </label>
                </div>
                <p className="text-xs text-sun-brown font-medium leading-relaxed">
                  Helps us understand which botanical guides and products are most loved so we can continually optimize site speed and performance across Pakistan.
                </p>
              </div>

              {/* Marketing & Personalization */}
              <div className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 space-y-2 shadow-retro-sm">
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-sm text-sun-dark uppercase">
                    3. Marketing & Experience Cookies
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingEnabled}
                      onChange={(e) => setMarketingEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sun-dark border-2 border-sun-dark"></div>
                  </label>
                </div>
                <p className="text-xs text-sun-brown font-medium leading-relaxed">
                  Allows us to remember your Routine Finder results and deliver personalized discounts on your favourite herbal kits.
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t-2 border-sun-dark/15">
              <button
                onClick={handleEssentialOnly}
                className="w-full sm:w-auto bg-sun-sand text-sun-dark font-black text-xs px-5 py-3 rounded-full border-2 border-sun-dark hover:bg-amber-100 transition-colors uppercase"
              >
                Reject Non-Essential
              </button>

              <button
                onClick={handleSaveCustom}
                className="w-full sm:w-auto bg-sun-yellow text-sun-dark font-black text-xs px-6 py-3 rounded-full border-2 border-sun-dark hover:bg-amber-400 transition-all shadow-retro uppercase flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save My Preferences</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
