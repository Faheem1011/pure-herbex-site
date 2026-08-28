import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Mail, Phone, MapPin, Package, Heart, LogOut, CheckCircle2, 
  AlertCircle, X, ArrowRight, ShoppingBag, Eye, Sparkles, Instagram, Award, 
  DollarSign, Tag, Globe, Check 
} from 'lucide-react';
import { CustomerUser, getCurrentCustomer, loginCustomer, registerCustomer, logoutCustomer, updateCustomerProfile, getCustomerOrders } from '../services/customerAuth';
import { Order, Product } from '../types';
import { PRODUCTS } from '../data/products';
import { SORTED_PAKISTAN_CITIES } from '../data/pakistanCities';
import { registerCreatorAccount, loginCreatorWithEmail, getCurrentCreator } from '../services/creatorService';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onOpenTrackOrder: (trackingOrOrderId?: string) => void;
  onNavigateToCreators?: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  onOpenTrackOrder,
  onNavigateToCreators
}) => {
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'orders' | 'wishlist' | 'profile'>('login');
  
  // Registration Type: Customer vs Creator
  const [accountType, setAccountType] = useState<'customer' | 'creator'>('customer');

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [address, setAddress] = useState('');
  
  // Creator-Specific Signup State
  const [socialHandle, setSocialHandle] = useState('');
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'facebook'>('instagram');
  const [customPromoCode, setCustomPromoCode] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Orders State
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const user = getCurrentCustomer();
    setCurrentUser(user);
    if (user) {
      setActiveTab('orders');
      loadOrders();
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setCity(user.city || 'Lahore');
      setAddress(user.address || '');
    } else {
      setActiveTab('login');
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const orders = await getCustomerOrders();
      setCustomerOrders(orders);
    } catch (e) {
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const res = await loginCustomer({ email, password });
    
    // Also try logging in as creator if registered as one
    try {
      await loginCreatorWithEmail(email);
    } catch (e) {}

    setLoading(false);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setActiveTab('orders');
      loadOrders();
    } else {
      setAuthError(res.error || 'Failed to login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    // 1. If registering as Content Creator
    if (accountType === 'creator') {
      if (!socialHandle.trim()) {
        setLoading(false);
        setAuthError('Please provide your Instagram, TikTok, or YouTube social handle.');
        return;
      }

      const fullSocial = socialHandle.startsWith('@') ? socialHandle : `@${socialHandle}`;
      const creatorRes = await registerCreatorAccount({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        socialHandle: `${fullSocial} (${socialPlatform})`,
        customPromoCode: customPromoCode.trim(),
        payoutMethod,
        accountNumber: accountNumber.trim(),
        accountTitle: fullName.trim()
      });

      if (!creatorRes.success) {
        setLoading(false);
        setAuthError(creatorRes.error || 'Failed to create creator account');
        return;
      }
    }

    // 2. Register Standard Customer Profile
    const res = await registerCustomer({ email, password, fullName, phone, city, address });
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (accountType === 'creator') {
        setAuthSuccess('🎉 Creator account registered! You can now access the Creator Portal.');
        setTimeout(() => {
          onClose();
          if (onNavigateToCreators) {
            onNavigateToCreators();
          } else {
            window.location.href = '/creators';
          }
        }, 1500);
      } else {
        setActiveTab('orders');
        loadOrders();
      }
    } else {
      setAuthError(res.error || 'Failed to create account');
    }
  };

  const handleLogout = () => {
    logoutCustomer();
    setCurrentUser(null);
    setActiveTab('login');
    setEmail('');
    setPassword('');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateCustomerProfile({ fullName, phone, city, address });
    if (updated) {
      setCurrentUser(updated);
      setAuthSuccess('Profile & delivery details updated successfully!');
      setTimeout(() => setAuthSuccess(''), 3000);
    }
  };

  const wishlistProducts = currentUser
    ? PRODUCTS.filter(p => currentUser.wishlistProductIds.includes(p.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-retro-lg relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-sun-sand p-2 rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors z-10"
        >
          <X className="w-5 h-5 text-sun-dark" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b-2 border-sun-dark/15 pb-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sun-yellow border-2 border-sun-dark flex items-center justify-center shadow-retro-sm">
            <User className="w-6 h-6 text-sun-dark" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-sun-dark">
              {currentUser ? `Assalam-o-Alaikum, ${currentUser.fullName.split(' ')[0]}!` : 'Customer & Creator Account'}
            </h2>
            <p className="text-xs font-bold text-sun-brown">
              {currentUser ? 'Manage your order history, delivery addresses, and wishlist.' : 'Log in to track shipments, view your orders, or sign up as a creator.'}
            </p>
          </div>
        </div>

        {currentUser ? (
          /* LOGGED IN VIEW */
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-sun-dark/15 pb-3">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`font-black text-xs uppercase px-4 py-2 rounded-full border-2 border-sun-dark transition-all flex items-center gap-1.5 ${
                  activeTab === 'orders' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-dark/80 hover:bg-amber-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> My Orders ({customerOrders.length})
              </button>

              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`font-black text-xs uppercase px-4 py-2 rounded-full border-2 border-sun-dark transition-all flex items-center gap-1.5 ${
                  activeTab === 'wishlist' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-dark/80 hover:bg-amber-100'
                }`}
              >
                <Heart className="w-3.5 h-3.5" /> Wishlist ({currentUser.wishlistProductIds.length})
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                className={`font-black text-xs uppercase px-4 py-2 rounded-full border-2 border-sun-dark transition-all flex items-center gap-1.5 ${
                  activeTab === 'profile' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-dark/80 hover:bg-amber-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Saved Address
              </button>

              <button 
                onClick={handleLogout}
                className="font-black text-xs uppercase px-4 py-2 rounded-full border-2 border-red-500 bg-red-100 text-red-700 hover:bg-red-200 ml-auto flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>

            {/* TAB: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-lg text-sun-dark uppercase">Your Order History</h3>
                  <button 
                    onClick={loadOrders}
                    className="text-xs font-bold text-amber-800 underline hover:text-sun-dark"
                  >
                    Refresh Orders
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="text-center py-8 text-xs font-bold text-sun-brown">Loading your order history...</div>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-8 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 mx-auto text-sun-dark opacity-30" />
                    <p className="text-sm font-bold text-sun-dark">No orders found matching your account.</p>
                    <p className="text-xs text-sun-brown">When you place an order with Cash on Delivery, it will appear here automatically with live tracking!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map(order => (
                      <div key={order.id} className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 shadow-retro-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sun-dark/10 pb-2">
                          <div>
                            <span className="font-mono text-xs font-black text-amber-800">Tracking #: {order.trackingNumber}</span>
                            <div className="text-[10px] text-sun-brown font-bold">{new Date(order.orderDate).toLocaleDateString()}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-500' :
                            order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800 border-blue-500' :
                            'bg-amber-100 text-amber-800 border-amber-500'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold text-sun-dark">
                              <span>• {item.quantity}x {item.product.name}</span>
                              <span>Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-sun-dark/10 text-xs">
                          <div>
                            <span className="font-bold text-sun-brown">Total (COD): </span>
                            <span className="font-black text-sun-dark text-sm">Rs. {order.totalAmount.toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={() => {
                              onOpenTrackOrder(order.trackingNumber);
                              onClose();
                            }}
                            className="bg-sun-yellow hover:bg-amber-400 text-sun-dark font-black text-xs px-3.5 py-1.5 rounded-full border border-sun-dark shadow-retro-sm flex items-center gap-1 uppercase"
                          >
                            <Eye className="w-3.5 h-3.5" /> Track Parcel Live
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <h3 className="font-display font-black text-lg text-sun-dark uppercase">Saved Botanical Wishlist</h3>
                {wishlistProducts.length === 0 ? (
                  <div className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-8 text-center space-y-3">
                    <Heart className="w-10 h-10 mx-auto text-sun-dark opacity-30" />
                    <p className="text-sm font-bold text-sun-dark">Your wishlist is empty. Browse products and tap the heart icon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistProducts.map(prod => (
                      <div key={prod.id} className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-3.5 flex items-center gap-3 shadow-retro-sm">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-16 h-16 object-contain rounded-xl bg-sun-cream border border-sun-dark p-1" 
                        />
                        <div className="flex-1 space-y-1">
                          <h4 className="font-display font-black text-xs text-sun-dark leading-tight">{prod.name}</h4>
                          <div className="font-black text-xs text-emerald-800">Rs. {prod.price.toLocaleString()}</div>
                          <button 
                            onClick={() => {
                              onAddToCart(prod);
                              onClose();
                            }}
                            className="bg-sun-yellow text-sun-dark font-black text-[10px] px-2.5 py-1 rounded-full border border-sun-dark flex items-center gap-1 uppercase shadow-retro-sm"
                          >
                            <ShoppingBag className="w-3 h-3" /> Add To Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SAVED PROFILE & ADDRESS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h3 className="font-display font-black text-lg text-sun-dark uppercase">Delivery Information</h3>
                
                {authSuccess && (
                  <div className="bg-emerald-100 border border-emerald-500 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {authSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Phone / WhatsApp</label>
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">City</label>
                    <select 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    >
                      {SORTED_PAKISTAN_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Complete Delivery Address</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="House/Street/Area"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-sun-yellow text-sun-dark font-black text-xs px-6 py-3 rounded-full border-2 border-sun-dark shadow-retro uppercase hover:bg-amber-400 transition-colors"
                >
                  Save Profile Details
                </button>
              </form>
            )}

          </div>
        ) : (
          /* NOT LOGGED IN: LOGIN OR REGISTER FORM */
          <div className="space-y-6">
            <div className="flex border-b border-sun-dark/15 pb-3 gap-3">
              <button 
                onClick={() => { setActiveTab('login'); setAuthError(''); setAuthSuccess(''); }}
                className={`font-black text-xs uppercase px-6 py-2.5 rounded-full border-2 border-sun-dark transition-all ${
                  activeTab === 'login' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-dark/80 hover:bg-amber-100'
                }`}
              >
                Log In
              </button>
              <button 
                onClick={() => { setActiveTab('register'); setAuthError(''); setAuthSuccess(''); }}
                className={`font-black text-xs uppercase px-6 py-2.5 rounded-full border-2 border-sun-dark transition-all ${
                  activeTab === 'register' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-dark/80 hover:bg-amber-100'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="bg-red-100 border border-red-500 text-red-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="bg-emerald-100 border border-emerald-500 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-sun-dark mb-1">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-4 py-2.5 pl-10 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                    <Mail className="w-4 h-4 text-sun-brown absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-sun-dark mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-4 py-2.5 pl-10 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                    <Lock className="w-4 h-4 text-sun-brown absolute left-3.5 top-3" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sun-yellow text-sun-dark font-black text-sm py-3.5 rounded-full border-2 border-sun-dark shadow-retro uppercase hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Logging in...' : 'Log In to Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                
                {/* Account Type Selector: Customer vs Creator */}
                <div className="bg-sun-sand p-1.5 rounded-2xl border-2 border-sun-dark grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAccountType('customer')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${
                      accountType === 'customer'
                        ? 'bg-sun-cream text-sun-dark border-2 border-sun-dark shadow-retro-sm'
                        : 'text-sun-brown hover:text-sun-dark'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('creator')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${
                      accountType === 'creator'
                        ? 'bg-sun-yellow text-sun-dark border-2 border-sun-dark shadow-retro-sm'
                        : 'text-amber-900 font-extrabold hover:text-sun-dark'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Content Creator (15%)</span>
                  </button>
                </div>

                {accountType === 'creator' && (
                  <div className="bg-amber-100 border-2 border-amber-600 p-3.5 rounded-2xl text-xs space-y-1 text-amber-950 font-medium animate-fade-in">
                    <div className="font-black uppercase flex items-center gap-1 text-amber-900">
                      <Award className="w-4 h-4" /> Creator Affiliate Program Benefits:
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      • Earn <strong>15% Commission (Rs. 270 / Kit)</strong> on every kit sold.
                      <br />
                      • Your followers get <strong>10% OFF (Save Rs. 180)</strong> with your custom code.
                      <br />
                      • Zero minimum payout threshold • Direct EasyPaisa / JazzCash / Bank payouts.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">
                      {accountType === 'creator' ? 'Creator / Full Name *' : 'Full Name *'}
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ayesha Khan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">
                      {accountType === 'creator' ? 'WhatsApp Phone (For Payouts) *' : 'Phone / WhatsApp *'}
                    </label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="0300-1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Password (Min 6 chars) *</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                {/* CREATOR-SPECIFIC FIELDS */}
                {accountType === 'creator' && (
                  <div className="space-y-3 pt-1 border-t border-sun-dark/15 animate-fade-in">
                    
                    {/* Social Platform & Handle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase text-sun-dark mb-1">Social Platform *</label>
                        <select 
                          value={socialPlatform} 
                          onChange={(e) => setSocialPlatform(e.target.value as any)}
                          className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                        >
                          <option value="instagram">Instagram (@handle)</option>
                          <option value="tiktok">TikTok (@handle)</option>
                          <option value="youtube">YouTube Channel</option>
                          <option value="facebook">Facebook Page / Profile</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-sun-dark mb-1">Social Media Handle / URL *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="@ayeshaskinroutine"
                          value={socialHandle}
                          onChange={(e) => setSocialHandle(e.target.value)}
                          className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                        />
                      </div>
                    </div>

                    {/* Custom Promo Code */}
                    <div>
                      <label className="block text-xs font-black uppercase text-sun-dark mb-1">
                        Preferred Custom Promo Code (Optional)
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. AYESHA10"
                          value={customPromoCode}
                          onChange={(e) => setCustomPromoCode(e.target.value.toUpperCase())}
                          className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-amber-900 focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                        />
                        <span className="absolute right-3 top-2 text-[10px] font-black text-sun-brown bg-sun-cream px-2 py-0.5 rounded border border-sun-dark/30">
                          10% OFF BUYER DISCOUNT
                        </span>
                      </div>
                      <p className="text-[10px] text-sun-brown mt-0.5">Leave blank to automatically create a promo code from your name.</p>
                    </div>

                    {/* Payout Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase text-sun-dark mb-1">Payout Method *</label>
                        <select 
                          value={payoutMethod} 
                          onChange={(e) => setPayoutMethod(e.target.value as any)}
                          className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                        >
                          <option value="easypaisa">EasyPaisa Mobile Account</option>
                          <option value="jazzcash">JazzCash Mobile Account</option>
                          <option value="bank">Bank Account Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-sun-dark mb-1">Account / Mobile Number *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="0300-1234567 or IBAN"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow font-mono"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {/* City & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">City</label>
                    <select 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    >
                      {SORTED_PAKISTAN_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-sun-dark mb-1">Delivery Address</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Street/House/Area"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sun-yellow text-sun-dark font-black text-sm py-3.5 rounded-full border-2 border-sun-dark shadow-retro uppercase hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <span>
                    {loading 
                      ? 'Creating Account...' 
                      : accountType === 'creator' 
                        ? 'Register as Content Creator (15% Commission)' 
                        : 'Register & Save Delivery Profile'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
