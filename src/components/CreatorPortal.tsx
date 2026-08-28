import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Gift, DollarSign, Users, ShoppingBag, ArrowRight, CheckCircle2, 
  Copy, Share2, Award, Zap, Instagram, Youtube, Phone, ShieldCheck, LogOut, 
  TrendingUp, RefreshCw, AlertCircle, Edit3, Check, ExternalLink, HelpCircle
} from 'lucide-react';
import { CreatorProfile, CreatorCommissionRecord, CreatorPayoutDetails } from '../types';
import { 
  getCurrentCreator, loginCreatorWithGoogle, registerCreatorAccount, 
  loginCreatorWithEmail, logoutCreator, updateCreatorPromoCode, 
  updateCreatorPayoutDetails, fetchCreatorOrders 
} from '../services/creatorService';

interface CreatorPortalProps {
  onNavigateHome: () => void;
  onOpenShop: () => void;
}

export const CreatorPortal: React.FC<CreatorPortalProps> = ({ onNavigateHome, onOpenShop }) => {
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'payouts' | 'assets'>('dashboard');
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [customPromo, setCustomPromo] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Promo code edit state
  const [isEditingPromo, setIsEditingPromo] = useState(false);
  const [newPromoInput, setNewPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Payout details state
  const [payoutMethod, setPayoutMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'other'>('easypaisa');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [payoutSavedMsg, setPayoutSavedMsg] = useState('');

  // Orders Ledger
  const [creatorOrders, setCreatorOrders] = useState<CreatorCommissionRecord[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check login on load
  useEffect(() => {
    const curr = getCurrentCreator();
    if (curr) {
      setCreator(curr);
      setNewPromoInput(curr.promoCode);
      setPayoutMethod(curr.payoutDetails?.method || 'easypaisa');
      setAccountTitle(curr.payoutDetails?.accountTitle || curr.name);
      setAccountNumber(curr.payoutDetails?.accountNumber || '');
      setBankName(curr.payoutDetails?.bankName || '');
      loadOrders(curr.id);
    }
  }, []);

  const loadOrders = (creatorId: string) => {
    const orders = fetchCreatorOrders(creatorId);
    setCreatorOrders(orders);
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      // Simulate Google OAuth popup with instant profile creation
      const simulatedGoogleProfile = {
        name: name.trim() || 'Verified Creator',
        email: email.trim().toLowerCase() || `creator_${Math.floor(1000 + Math.random() * 9000)}@gmail.com`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        googleId: 'google_' + Date.now()
      };

      const res = await loginCreatorWithGoogle(simulatedGoogleProfile);
      if (res.success && res.creator) {
        setCreator(res.creator);
        setNewPromoInput(res.creator.promoCode);
        loadOrders(res.creator.id);
      } else {
        setAuthError(res.error || 'Google login failed');
      }
    } catch (e: any) {
      setAuthError(e.message || 'Google Auth Error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setAuthError('Please fill in your name and email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    const res = await registerCreatorAccount({
      name,
      email,
      phone,
      socialHandle,
      customPromoCode: customPromo
    });

    setAuthLoading(false);
    if (res.success && res.creator) {
      setCreator(res.creator);
      setNewPromoInput(res.creator.promoCode);
      loadOrders(res.creator.id);
    } else {
      setAuthError(res.error || 'Registration failed');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    const res = await loginCreatorWithEmail(email);
    setAuthLoading(false);
    if (res.success && res.creator) {
      setCreator(res.creator);
      setNewPromoInput(res.creator.promoCode);
      loadOrders(res.creator.id);
    } else {
      setAuthError(res.error || 'Account not found. Please sign up.');
    }
  };

  const handleLogout = () => {
    logoutCreator();
    setCreator(null);
    setActiveTab('dashboard');
  };

  const handleUpdatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    setPromoError('');
    setPromoSuccess('');

    const res = updateCreatorPromoCode(creator.id, newPromoInput);
    if (res.success && res.promoCode) {
      setCreator(prev => prev ? { ...prev, promoCode: res.promoCode! } : null);
      setPromoSuccess(`Promo code updated to "${res.promoCode}" successfully!`);
      setIsEditingPromo(false);
    } else {
      setPromoError(res.error || 'Could not update promo code.');
    }
  };

  const handleSavePayoutDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    const details: CreatorPayoutDetails = {
      method: payoutMethod,
      accountTitle,
      accountNumber,
      bankName
    };
    updateCreatorPayoutDetails(creator.id, details);
    setCreator(prev => prev ? { ...prev, payoutDetails: details } : null);
    setPayoutSavedMsg('✅ Payout account updated successfully! Weekly payouts are sent here.');
    setTimeout(() => setPayoutSavedMsg(''), 4000);
  };

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://pureherbex.com';
  const referralLink = `${siteOrigin}?promo=${creator?.promoCode || 'GLOW10'}`;

  const copyToClipboard = (text: string, isCode = false) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isCode) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const shareViaWhatsApp = () => {
    const text = `Hey! 🌸 I'm super excited to share my secret botanical skincare routine from *Koveria Glow by Pure Herbex*! Use my exclusive creator code *${creator?.promoCode}* to get *10% OFF* your complete kit.\n\nOrder here with 1-click discount applied: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-sun-sand text-sun-dark pb-20">
      
      {/* Top Banner / Breadcrumb */}
      <div className="bg-sun-yellow border-b-4 border-sun-dark py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sun-dark" />
            <span>KOVERIA GLOW CREATOR & INFLUENCER CIRCLE</span>
          </div>
          <button 
            onClick={onNavigateHome}
            className="text-xs font-black bg-sun-cream px-3 py-1 rounded-full border-2 border-sun-dark hover:bg-sun-sand transition-colors"
          >
            ← Back to Store
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* If Not Logged In: Show Onboarding & Auth */}
        {!creator ? (
          <div className="space-y-12">
            
            {/* Hero Section */}
            <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-12 shadow-retro-lg text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-sun-yellow/30 rounded-full blur-2xl pointer-events-none"></div>
              
              <span className="badge-sticker badge-sticker-yellow text-xs sm:text-sm uppercase tracking-wider mb-4 inline-block">
                ✨ INFLUENCER & AFFILIATE PROGRAM
              </span>

              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-sun-dark max-w-4xl mx-auto leading-none">
                SHARE BOTANICAL GLOW. <br/>
                <span className="text-amber-600">EARN 15% COMMISSION</span> ON EVERY KIT.
              </h1>

              <p className="mt-4 text-sm sm:text-lg font-bold text-sun-brown max-w-2xl mx-auto">
                Create videos for your audience, give them an exclusive <strong>10% discount code</strong>, and receive <strong>15% commission (Rs. 270 per kit)</strong> directly into your EasyPaisa, JazzCash, or Bank Account.
              </p>

              {/* Value Props 3-Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
                <div className="bg-sun-sand border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-2">
                  <div className="w-10 h-10 bg-sun-yellow border-2 border-sun-dark rounded-xl flex items-center justify-center font-black text-lg shadow-retro-sm">
                    💸
                  </div>
                  <h3 className="font-display font-black text-lg uppercase text-sun-dark">15% Instant Commission</h3>
                  <p className="text-xs text-sun-brown font-semibold">
                    Earn Rs. 270 on each flat Rs. 1,800 complete kit sold with your custom promo code.
                  </p>
                </div>

                <div className="bg-sun-sand border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-2">
                  <div className="w-10 h-10 bg-emerald-300 border-2 border-sun-dark rounded-xl flex items-center justify-center font-black text-lg shadow-retro-sm">
                    🎟️
                  </div>
                  <h3 className="font-display font-black text-lg uppercase text-sun-dark">10% Off For Followers</h3>
                  <p className="text-xs text-sun-brown font-semibold">
                    Give your community an exclusive discount code that increases conversions on your videos.
                  </p>
                </div>

                <div className="bg-sun-sand border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-2">
                  <div className="w-10 h-10 bg-amber-300 border-2 border-sun-dark rounded-xl flex items-center justify-center font-black text-lg shadow-retro-sm">
                    ⚡
                  </div>
                  <h3 className="font-display font-black text-lg uppercase text-sun-dark">Weekly COD Payouts</h3>
                  <p className="text-xs text-sun-brown font-semibold">
                    Direct automated transfers to your EasyPaisa, JazzCash, or Bank account as soon as deliveries complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Auth Box */}
            <div className="max-w-xl mx-auto bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro-lg space-y-6">
              
              <div className="text-center space-y-1">
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-sun-dark">
                  {authMode === 'register' ? 'Join Creator Program' : 'Creator Portal Login'}
                </h2>
                <p className="text-xs font-bold text-sun-brown">
                  {authMode === 'register' 
                    ? 'Sign up with Google ID or Email to set up your custom promo code instantly.' 
                    : 'Access your earnings, sales stats, and payout ledger.'}
                </p>
              </div>

              {/* 1-Click Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={authLoading}
                className="w-full bg-white text-gray-900 font-extrabold py-3.5 px-4 rounded-2xl border-2 border-sun-dark hover:bg-gray-50 transition-all shadow-retro-sm flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google ID</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-[1px] bg-sun-dark/20"></div>
                <span className="text-[11px] font-black uppercase text-sun-brown">or use email details</span>
                <div className="flex-1 h-[1px] bg-sun-dark/20"></div>
              </div>

              {authError && (
                <div className="bg-red-50 border-2 border-red-500 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'register' ? (
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Your Full Name / Creator Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ayesha Khan" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. ayesha.beauty@gmail.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-sun-dark mb-1">WhatsApp Phone (For Payouts)</label>
                      <input 
                        type="tel" 
                        placeholder="0300-1234567" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-sun-dark mb-1">Social Handle (Insta / TikTok)</label>
                      <input 
                        type="text" 
                        placeholder="@yourhandle" 
                        value={socialHandle} 
                        onChange={e => setSocialHandle(e.target.value)} 
                        className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">
                      Choose Your Preferred Promo Code (Optional)
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. AYESHA10" 
                        value={customPromo} 
                        onChange={e => setCustomPromo(e.target.value.toUpperCase())} 
                        className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-black uppercase tracking-wider focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-sun-brown">10% OFF</span>
                    </div>
                    <p className="text-[11px] text-sun-brown mt-1">If left blank, one will be created from your name.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-sun-yellow text-sun-dark font-black py-4 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <span>{authLoading ? 'Creating Creator Account...' : 'Sign Up & Get Creator Code'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      className="text-xs font-black text-amber-800 hover:underline"
                    >
                      Already registered as a creator? Log in here →
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Your Registered Email *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. ayesha.beauty@gmail.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-sun-yellow text-sun-dark font-black py-4 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <span>{authLoading ? 'Signing In...' : 'Log In to Creator Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      className="text-xs font-black text-amber-800 hover:underline"
                    >
                      New creator? Register your promo code here →
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        ) : (
          /* Logged In: Creator Dashboard */
          <div className="space-y-8 animate-fade-in">
            
            {/* Top Creator Header Card */}
            <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-4">
                <img 
                  src={creator.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                  alt={creator.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-3 border-sun-dark object-cover shadow-retro-sm"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-sun-dark uppercase">
                      {creator.name}
                    </h2>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED CREATOR
                    </span>
                  </div>
                  <p className="text-xs font-bold text-sun-brown">
                    {creator.email} {creator.socialHandle ? `• ${creator.socialHandle}` : ''}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-black bg-sun-yellow text-sun-dark px-3 py-1 rounded-full border border-sun-dark shadow-retro-sm">
                      🎟️ Your Code: <strong>{creator.promoCode}</strong> (10% OFF)
                    </span>
                    <span className="text-xs font-black bg-amber-200 text-amber-900 px-3 py-1 rounded-full border border-sun-dark shadow-retro-sm">
                      💰 15% Commission Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsEditingPromo(true)}
                  className="flex-1 md:flex-initial bg-sun-sand text-sun-dark font-black text-xs px-4 py-2.5 rounded-xl border-2 border-sun-dark hover:bg-sun-yellow transition-colors shadow-retro-sm flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customize Promo Code</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-sun-sand text-red-700 font-black text-xs px-4 py-2.5 rounded-xl border-2 border-sun-dark hover:bg-red-100 transition-colors shadow-retro-sm flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>

            </div>

            {/* Real-Time Payout Processing Alert Banner */}
            {creator.lastPayoutStatus === 'processing' && (
              <div className="bg-amber-100 border-3 border-amber-600 text-amber-950 p-5 rounded-2xl shadow-retro-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-400 border-2 border-sun-dark rounded-xl flex items-center justify-center font-black text-lg">
                    ⏳
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase">Payout Is Currently Being Processed by Admin</h4>
                    <p className="text-xs font-semibold text-amber-900 mt-0.5">
                      {creator.lastPayoutNote || `Your payout of Rs. ${creator.pendingCommission.toLocaleString()} is currently being transferred to your ${creator.payoutDetails?.method?.toUpperCase()} account.`}
                    </p>
                  </div>
                </div>
                <span className="bg-amber-400 text-sun-dark text-[11px] font-black px-3 py-1 rounded-full border border-sun-dark uppercase shrink-0">
                  Processing Payout
                </span>
              </div>
            )}

            {creator.lastPayoutStatus === 'paid' && creator.lastPayoutTrxId && (
              <div className="bg-emerald-100 border-3 border-emerald-600 text-emerald-950 p-4 rounded-2xl shadow-retro-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="text-xs font-bold">
                    <span>Recent Payout Completed: </span>
                    <strong className="font-mono text-emerald-900">Trx ID: {creator.lastPayoutTrxId}</strong>
                    {creator.lastPayoutNote && <span className="text-emerald-800 ml-2 font-medium">({creator.lastPayoutNote})</span>}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500">
                  PAID ✓
                </span>
              </div>
            )}

            {/* Economics & Rules Card */}
            <div className="bg-sun-sand border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-sun-dark/15 pb-2">
                <span className="font-black text-xs uppercase text-sun-dark">💎 Creator Economics & Guaranteed Rewards</span>
                <span className="bg-sun-yellow text-sun-dark text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sun-dark">
                  NO MINIMUM PAYOUT THRESHOLD
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="bg-sun-cream p-3 rounded-xl border border-sun-dark/20">
                  <span className="text-sun-brown block font-bold text-[10px] uppercase">1. Follower Discount</span>
                  <strong className="text-emerald-700 font-black">10% OFF on Rs. 1,800 (Save Rs. 180)</strong>
                  <p className="text-[10px] text-sun-brown">Buyer pays Rs. 1,620 for Complete Kit</p>
                </div>
                <div className="bg-sun-cream p-3 rounded-xl border border-sun-dark/20">
                  <span className="text-sun-brown block font-bold text-[10px] uppercase">2. Your Commission</span>
                  <strong className="text-amber-800 font-black">15% on Rs. 1,800 (Earn Rs. 270 / Kit)</strong>
                  <p className="text-[10px] text-sun-brown">Accrued automatically on every sale</p>
                </div>
                <div className="bg-sun-cream p-3 rounded-xl border border-sun-dark/20">
                  <span className="text-sun-brown block font-bold text-[10px] uppercase">3. Total Value Given</span>
                  <strong className="text-sun-dark font-black">Rs. 450 Combined Value per Kit</strong>
                  <p className="text-[10px] text-sun-brown">Manual review & direct EasyPaisa transfer</p>
                </div>
              </div>
            </div>

            {/* Live Stats 4-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Kits Sold */}
              <div className="bg-sun-cream border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-black uppercase text-sun-brown">
                  <span>Kits Sold</span>
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                </div>
                <div className="font-display font-black text-3xl text-sun-dark">
                  {creator.totalKitsSold} <span className="text-sm font-bold text-sun-brown">kits</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-700">
                  Rs. 270 commission / kit
                </p>
              </div>

              {/* Total Revenue */}
              <div className="bg-sun-cream border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-black uppercase text-sun-brown">
                  <span>Total Sales Driven</span>
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="font-display font-black text-3xl text-sun-dark">
                  Rs. {creator.totalRevenue.toLocaleString()}
                </div>
                <p className="text-[11px] font-bold text-sun-brown">
                  Audience orders via your code
                </p>
              </div>

              {/* Total Commission Earned */}
              <div className="bg-sun-cream border-3 border-sun-dark p-5 rounded-2xl shadow-retro-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-black uppercase text-sun-brown">
                  <span>Total Commission (15%)</span>
                  <DollarSign className="w-4 h-4 text-amber-700" />
                </div>
                <div className="font-display font-black text-3xl text-amber-800">
                  Rs. {creator.totalCommissionEarned.toLocaleString()}
                </div>
                <p className="text-[11px] font-bold text-amber-900">
                  Rs. {creator.totalPaidCommission.toLocaleString()} paid out
                </p>
              </div>

              {/* Pending Payout */}
              <div className="bg-emerald-50 border-3 border-emerald-600 p-5 rounded-2xl shadow-retro-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-800">
                  <span>Pending Payout</span>
                  <Zap className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="font-display font-black text-3xl text-emerald-700">
                  Rs. {creator.pendingCommission.toLocaleString()}
                </div>
                <p className="text-[11px] font-black text-emerald-800">
                  Disbursing via {creator.payoutDetails?.method?.toUpperCase() || 'EASYPAISA'}
                </p>
              </div>

            </div>

            {/* 1-Click Viral Referral Link & Share Toolkit */}
            <div className="bg-sun-yellow border-4 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro-lg space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="badge-sticker bg-sun-cream text-sun-dark text-xs uppercase font-black">
                    🚀 1-CLICK VIRAL REFERRAL LINK
                  </span>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-sun-dark uppercase mt-1">
                    Your Auto-Discount Store Link
                  </h3>
                  <p className="text-xs font-bold text-sun-brown">
                    Anyone who clicks this link gets <strong>10% off auto-applied in their cart</strong>, and you earn <strong>15% commission</strong>!
                  </p>
                </div>
              </div>

              {/* Copy Box */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-sun-cream border-2 border-sun-dark rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono font-bold text-sun-dark truncate flex items-center shadow-retro-sm">
                  {referralLink}
                </div>
                
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="bg-sun-dark text-sun-yellow font-black px-6 py-3 rounded-2xl border-2 border-sun-dark hover:bg-amber-900 transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-retro-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={() => copyToClipboard(creator.promoCode, true)}
                  className="bg-sun-cream text-sun-dark font-black px-5 py-3 rounded-2xl border-2 border-sun-dark hover:bg-sun-sand transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-retro-sm"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Code Copied!' : `Copy Code (${creator.promoCode})`}</span>
                </button>
              </div>

              {/* Instant Social Sharing Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <span className="text-xs font-black uppercase text-sun-dark">Share Instantly:</span>
                
                <button
                  onClick={shareViaWhatsApp}
                  className="bg-emerald-600 text-white font-black text-xs py-2 px-4 rounded-xl border-2 border-sun-dark hover:bg-emerald-700 transition-colors shadow-retro-sm flex items-center gap-2 uppercase"
                >
                  <span>📲 WhatsApp Status / Chat</span>
                </button>

                <button
                  onClick={() => {
                    copyToClipboard(`Use my code ${creator.promoCode} for 10% OFF at pureherbex.com! 🌸 Link: ${referralLink}`);
                    alert('Copied Instagram/TikTok caption to clipboard!');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-xs py-2 px-4 rounded-xl border-2 border-sun-dark hover:opacity-90 transition-opacity shadow-retro-sm flex items-center gap-2 uppercase"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Copy Instagram / TikTok Caption</span>
                </button>
              </div>

            </div>

            {/* Dashboard Tabs: Orders Ledger | Payouts | Content Assets */}
            <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 shadow-retro-lg space-y-6">
              
              {/* Tab Selector */}
              <div className="flex border-b-2 border-sun-dark gap-4 pb-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`font-display font-black text-sm uppercase pb-2 transition-colors border-b-4 -mb-[10px] ${
                    activeTab === 'dashboard' ? 'border-sun-yellow text-sun-dark' : 'border-transparent text-sun-brown hover:text-sun-dark'
                  }`}
                >
                  📋 Sales & Commission Ledger ({creatorOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('payouts')}
                  className={`font-display font-black text-sm uppercase pb-2 transition-colors border-b-4 -mb-[10px] ${
                    activeTab === 'payouts' ? 'border-sun-yellow text-sun-dark' : 'border-transparent text-sun-brown hover:text-sun-dark'
                  }`}
                >
                  💳 Payout Settings (EasyPaisa / JazzCash / Bank)
                </button>
                <button
                  onClick={() => setActiveTab('assets')}
                  className={`font-display font-black text-sm uppercase pb-2 transition-colors border-b-4 -mb-[10px] ${
                    activeTab === 'assets' ? 'border-sun-yellow text-sun-dark' : 'border-transparent text-sun-brown hover:text-sun-dark'
                  }`}
                >
                  🎬 Creator Video Hooks & Guidelines
                </button>
              </div>

              {/* Tab 1: Orders Ledger */}
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  {creatorOrders.length === 0 ? (
                    <div className="text-center py-12 bg-sun-sand rounded-2xl border-2 border-sun-dark space-y-3">
                      <ShoppingBag className="w-12 h-12 mx-auto text-sun-dark opacity-30" />
                      <h4 className="font-display font-black text-lg text-sun-dark uppercase">No Orders Tracked Yet</h4>
                      <p className="text-xs font-semibold text-sun-brown max-w-sm mx-auto">
                        Share your promo code <strong>{creator.promoCode}</strong> or link with your followers on TikTok, Instagram, or WhatsApp to see sales appear here in real-time!
                      </p>
                      <button 
                        onClick={shareViaWhatsApp}
                        className="bg-sun-yellow text-sun-dark font-black text-xs px-5 py-2.5 rounded-full border-2 border-sun-dark shadow-retro-sm uppercase"
                      >
                        Share Code on WhatsApp
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-sun-sand border-b-2 border-sun-dark text-sun-dark font-black uppercase">
                            <th className="p-3">Order Date</th>
                            <th className="p-3">Order Ref</th>
                            <th className="p-3">Customer City</th>
                            <th className="p-3">Kits Sold</th>
                            <th className="p-3">Order Subtotal</th>
                            <th className="p-3">Follower 10% Saved</th>
                            <th className="p-3 text-amber-900">Your 15% Commission</th>
                            <th className="p-3">Payout Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sun-dark/15 font-bold">
                          {creatorOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-sun-sand/50 transition-colors">
                              <td className="p-3">{new Date(ord.orderDate).toLocaleDateString()}</td>
                              <td className="p-3 font-mono">{ord.orderId}</td>
                              <td className="p-3">{ord.customerCity}</td>
                              <td className="p-3">
                                <span className="bg-sun-yellow text-sun-dark px-2 py-0.5 rounded-md border border-sun-dark font-black">
                                  {ord.kitsCount} kit{ord.kitsCount > 1 ? 's' : ''}
                                </span>
                              </td>
                              <td className="p-3">Rs. {ord.orderSubtotal.toLocaleString()}</td>
                              <td className="p-3 text-emerald-700">-Rs. {ord.discountApplied.toLocaleString()}</td>
                              <td className="p-3 font-black text-amber-800 text-sm">
                                +Rs. {ord.commissionEarned.toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  ord.status === 'paid' 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-600' 
                                    : 'bg-amber-100 text-amber-800 border-amber-600'
                                }`}>
                                  {ord.status === 'paid' ? 'PAID ✓' : 'PENDING COD'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Payout Settings */}
              {activeTab === 'payouts' && (
                <div className="space-y-6 max-w-xl">
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-lg text-sun-dark uppercase">Payout Account Details</h4>
                    <p className="text-xs text-sun-brown font-semibold">
                      Commissions are disbursed directly after Leopards Courier delivers the COD order to your followers.
                    </p>
                  </div>

                  {payoutSavedMsg && (
                    <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-800 p-3 rounded-xl text-xs font-bold">
                      {payoutSavedMsg}
                    </div>
                  )}

                  <form onSubmit={handleSavePayoutDetails} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-sun-dark mb-1">Select Payout Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['easypaisa', 'jazzcash', 'bank'] as const).map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPayoutMethod(method)}
                            className={`py-2.5 px-3 rounded-xl border-2 border-sun-dark text-xs font-black uppercase transition-all ${
                              payoutMethod === method ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-dark hover:bg-sun-cream'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-sun-dark mb-1">Account Title (Name on Account) *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Ayesha Khan" 
                        value={accountTitle} 
                        onChange={e => setAccountTitle(e.target.value)} 
                        className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-sun-dark mb-1">
                        {payoutMethod === 'bank' ? 'Bank Account / IBAN Number *' : `${payoutMethod.toUpperCase()} Mobile Number *`}
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder={payoutMethod === 'bank' ? 'PK00BANK0000001234567890' : '03001234567'} 
                        value={accountNumber} 
                        onChange={e => setAccountNumber(e.target.value)} 
                        className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                      />
                    </div>

                    {payoutMethod === 'bank' && (
                      <div>
                        <label className="block text-xs font-black uppercase text-sun-dark mb-1">Bank Name *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Meezan Bank / HBL / Alfalah" 
                          value={bankName} 
                          onChange={e => setBankName(e.target.value)} 
                          className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sun-yellow focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="bg-sun-dark text-sun-yellow font-black py-3 px-6 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-900 uppercase text-xs tracking-wider"
                    >
                      Save Payout Account
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 3: Creator Video Hooks & Guidelines */}
              {activeTab === 'assets' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-lg text-sun-dark uppercase">High-Converting Video Hooks & Tips</h4>
                    <p className="text-xs text-sun-brown font-semibold">
                      Use these talking points to maximize video engagement and convert viewers into orders.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl space-y-2">
                      <span className="font-black text-sun-dark uppercase block">🎯 Hook 1: "Glass Skin Without Chemical Peels"</span>
                      <p className="text-sun-brown italic">
                        "If you want glowing skin for wedding season or summer without using bleach or steroids, this 100% freshly handmade Koveria Glow Face Pack is magic..."
                      </p>
                    </div>

                    <div className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl space-y-2">
                      <span className="font-black text-sun-dark uppercase block">🎯 Hook 2: "Instant Brightness In 15 Mins"</span>
                      <p className="text-sun-brown italic">
                        "Show mixing the Rose Petals + Moringa powder with Pure Rose Water. Apply on face, wash after 15 mins to show the instant radiant after-glow."
                      </p>
                    </div>

                    <div className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl space-y-2">
                      <span className="font-black text-sun-dark uppercase block">📦 Call To Action (CTA)</span>
                      <p className="text-sun-brown font-bold">
                        "Use my exclusive promo code <span className="text-sun-dark bg-sun-yellow px-1 py-0.5 rounded border border-sun-dark">{creator.promoCode}</span> for 10% OFF at pureherbex.com. Flat Rs. 150 Leopards COD nationwide!"
                      </p>
                    </div>

                    <div className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl space-y-2">
                      <span className="font-black text-sun-dark uppercase block">🌿 Key Botanical Highlights</span>
                      <ul className="list-disc list-inside space-y-1 text-sun-brown font-semibold">
                        <li>100% Steam-distilled pure rose water</li>
                        <li>Freshly blended with organic Moringa & Coffee</li>
                        <li>Non-stripping organic Aloe Vera toner</li>
                        <li>Flat Rs. 1,800 Complete 3-Piece Kit</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* Customize Promo Code Modal */}
      {isEditingPromo && creator && (
        <div className="fixed inset-0 z-50 bg-sun-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b-2 border-sun-dark pb-3">
              <h3 className="font-display font-black text-xl text-sun-dark uppercase">Customize Promo Code</h3>
              <button 
                onClick={() => { setIsEditingPromo(false); setPromoError(''); }}
                className="p-1 rounded-full border border-sun-dark hover:bg-sun-sand"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-sun-brown font-semibold">
              Enter your desired custom promo code. Followers will type this at checkout to receive 10% off.
            </p>

            {promoError && (
              <div className="bg-red-50 border border-red-500 text-red-700 p-2 rounded-xl text-xs font-bold">
                {promoError}
              </div>
            )}

            <form onSubmit={handleUpdatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-sun-dark mb-1">New Promo Code</label>
                <input 
                  type="text" 
                  required 
                  value={newPromoInput} 
                  onChange={e => setNewPromoInput(e.target.value.toUpperCase())}
                  placeholder="e.g. FATIMA10"
                  className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-sm font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsEditingPromo(false); setPromoError(''); }}
                  className="flex-1 bg-sun-sand text-sun-dark font-black py-3 rounded-full border-2 border-sun-dark text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sun-yellow text-sun-dark font-black py-3 rounded-full border-2 border-sun-dark shadow-retro text-xs uppercase hover:bg-amber-400"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
