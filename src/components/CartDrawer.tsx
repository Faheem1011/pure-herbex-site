import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ShieldCheck, CheckCircle, ArrowRight, Gift, Sparkles, User, Tag, Check, AlertCircle } from 'lucide-react';
import { CartItem, Product } from '../types';
import { PRODUCTS } from '../data/products';
import { submitCustomerOrder } from '../services/supabase';
import { createCourierShipment } from '../services/courier/runCourierService';
import { getCurrentCustomer } from '../services/customerAuth';
import { validatePromoCode, getActivePromoCode, saveActivePromoCode, clearActivePromoCode, processOrderCreatorCommission } from '../services/creatorService';
import { SORTED_PAKISTAN_CITIES } from '../data/pakistanCities';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onAddToCart: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCart
}) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderTrackingCode, setOrderTrackingCode] = useState('');
  const [leopardTrackingCode, setLeopardTrackingCode] = useState('');
  const [lastWaMessage, setLastWaMessage] = useState('');
  
  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');
  const [promoErrorMsg, setPromoErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: 'Lahore',
    address: '',
    notes: ''
  });

  // Check saved customer & active promo code on open
  useEffect(() => {
    if (isOpen) {
      const user = getCurrentCustomer();
      if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.fullName || prev.fullName,
          phone: user.phone || prev.phone,
          city: user.city || prev.city,
          address: user.address || prev.address
        }));
      }

      // Check if there is an active creator promo code in storage
      const activeCode = getActivePromoCode();
      if (activeCode && !appliedPromo) {
        const val = validatePromoCode(activeCode);
        if (val.isValid) {
          setAppliedPromo(val.code || activeCode);
          setDiscountPercent(val.discountPercent || 10);
          setPromoSuccessMsg(val.message || `🎉 10% Creator Discount applied!`);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Memoize cart derived states to prevent recalculation on every render (e.g. when typing in forms)
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return appliedPromo && discountPercent > 0 ? Math.round(subtotal * (discountPercent / 100)) : 0;
  }, [subtotal, appliedPromo, discountPercent]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingCost = 150; // Flat Rs. 150 delivery charges
  const totalAmount = discountedSubtotal + shippingCost;

  // Check if eligible for upselling to the Complete Kit
  const hasFacePack = useMemo(() => cartItems.some(i => i.product.id === 'koveria-glow-face-pack'), [cartItems]);
  const hasToner = useMemo(() => cartItems.some(i => i.product.id === 'koveria-glow-toner'), [cartItems]);
  const hasRoseWater = useMemo(() => cartItems.some(i => i.product.id === 'pure-rose-water'), [cartItems]);
  const hasCompleteKit = useMemo(() => cartItems.some(i => i.product.id === 'koveria-glow-complete-kit'), [cartItems]);

  const showUpsell = (hasFacePack || hasToner || hasRoseWater) && !hasCompleteKit;

  const handleUpgradeToKit = () => {
    onRemoveItem('koveria-glow-face-pack');
    onRemoveItem('koveria-glow-toner');
    onRemoveItem('pure-rose-water');
    
    const kitProduct = PRODUCTS.find(p => p.id === 'koveria-glow-complete-kit');
    if (kitProduct) {
      onAddToCart(kitProduct);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoErrorMsg('');
    setPromoSuccessMsg('');

    if (!promoInput.trim()) {
      setPromoErrorMsg('Please enter a creator promo code.');
      return;
    }

    const val = validatePromoCode(promoInput);
    if (val.isValid && val.code) {
      setAppliedPromo(val.code);
      setDiscountPercent(val.discountPercent || 10);
      setPromoSuccessMsg(val.message || `🎉 Creator code "${val.code}" applied! 10% OFF.`);
      saveActivePromoCode(val.code);
      setPromoInput('');
    } else {
      setPromoErrorMsg(val.message || 'Invalid or expired promo code.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoSuccessMsg('');
    setPromoErrorMsg('');
    clearActivePromoCode();
  };

  const buildWaMessage = (trackingCode: string, commissionAmt: number) => {
    const itemsSummary = cartItems.map(i => `• ${i.quantity}x ${i.product.name} (Rs. ${(i.product.price * i.quantity).toLocaleString()})`).join('\n');
    let promoLine = '';
    if (appliedPromo) {
      promoLine = `\n🎟️ *Creator Promo Used:* ${appliedPromo} (-10% OFF: Rs. ${discountAmount.toLocaleString()})\n💰 *Creator 15% Commission:* Rs. ${commissionAmt.toLocaleString()}`;
    }

    return `🛍️ *NEW ORDER PLACED ON PURE HERBEX!*\n-----------------------------------\n👤 *Customer Name:* ${formData.fullName}\n📞 *Phone:* ${formData.phone}\n📍 *City:* ${formData.city}\n🏠 *Address:* ${formData.address}\n-----------------------------------\n📦 *Order Items:*\n${itemsSummary}${promoLine}\n-----------------------------------\n💵 *Subtotal:* Rs. ${subtotal.toLocaleString()}${discountAmount > 0 ? `\n🏷️ *Discount (10% OFF):* -Rs. ${discountAmount.toLocaleString()}` : ''}\n🚚 *Delivery:* Rs. ${shippingCost} (Leopards COD via RUN)\n💰 *TOTAL AMOUNT:* Rs. ${totalAmount.toLocaleString()}\n🆔 *Leopards Tracking:* ${trackingCode}`;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    let trackingCode = 'LEO-' + Math.floor(100000000 + Math.random() * 900000000);

    // Process creator commission attribution if promo applied
    const commissionResult = processOrderCreatorCommission({
      orderId,
      appliedPromoCode: appliedPromo || undefined,
      cartItems,
      subtotal,
      discountAmount,
      customerCity: formData.city
    });

    try {
      // 1. Book shipment with RUN Courier (Forcing Leopard Gateway 28|1)
      const shipment = await createCourierShipment({
        orderId,
        receiverName: formData.fullName,
        receiverPhone: formData.phone,
        destinationCity: formData.city,
        receiverAddress: formData.address,
        pieces: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        weight: 1,
        collectionAmount: totalAmount,
        productDescription: cartItems.map(i => `${i.quantity}x ${i.product.name}`).join(', ')
      });

      if (shipment.thirdPartyTrackingNo) {
        trackingCode = shipment.thirdPartyTrackingNo;
      } else if (shipment.runTrackingNo) {
        trackingCode = shipment.runTrackingNo;
      }

      setLeopardTrackingCode(shipment.thirdPartyTrackingNo || trackingCode);

      // 2. Save Order to Database
      await submitCustomerOrder({
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        items: cartItems,
        subtotal: discountedSubtotal,
        shippingFee: shippingCost,
        totalAmount
      });
    } catch (err) {
      console.warn('Checkout/Shipment error:', err);
    } finally {
      setOrderTrackingCode(trackingCode);
      const msg = buildWaMessage(trackingCode, commissionResult.commissionEarned);
      setLastWaMessage(msg);

      // Auto-launch WhatsApp alert to Primary Admin number (+92 320 6972422)
      const primaryUrl = `https://wa.me/923206972422?text=${encodeURIComponent(msg)}`;
      window.open(primaryUrl, '_blank');

      setOrderComplete(true);
      onClearCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-sun-dark/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-sun-cream h-full flex flex-col justify-between shadow-2xl border-l-4 border-sun-dark relative">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-sun-yellow border-b-4 border-sun-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sun-dark" />
            <h2 className="font-display font-black text-xl text-sun-dark uppercase tracking-tight">
              YOUR GLOW CART ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-sun-cream rounded-full border-2 border-sun-dark hover:bg-sun-sand transition-colors"
          >
            <X className="w-5 h-5 text-sun-dark" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Order Complete Screen */}
          {orderComplete ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full border-4 border-sun-dark mx-auto flex items-center justify-center shadow-retro">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="badge-sticker badge-sticker-green text-xs uppercase">
                  🎉 ORDER CONFIRMED & DISPATCHED
                </span>
                <h3 className="font-display font-black text-2xl text-sun-dark uppercase">
                  THANK YOU, {formData.fullName.toUpperCase() || 'VALUED CUSTOMER'}!
                </h3>
                <p className="text-xs font-bold text-sun-brown">
                  Your order has been booked for Express Cash On Delivery via <strong className="text-sun-dark">Leopards Courier Service</strong>.
                </p>
              </div>

              <div className="bg-sun-sand border-2 border-sun-dark p-4 rounded-2xl text-left space-y-2 font-mono text-xs shadow-retro-sm">
                <div><strong className="text-sun-dark">Courier Tracking ID:</strong> {orderTrackingCode}</div>
                <div><strong className="text-sun-dark">Payment Method:</strong> Cash On Delivery (COD)</div>
                <div><strong className="text-sun-dark">Estimated Delivery:</strong> 3 to 4 Days Nationwide</div>
                {appliedPromo && (
                  <div className="text-emerald-700 font-bold border-t border-sun-dark/20 pt-1">
                    <strong>Creator Discount (10% OFF):</strong> Applied ({appliedPromo})
                  </div>
                )}
              </div>

              {/* Instant WhatsApp Admin Alert Buttons */}
              <div className="bg-emerald-50 border-2 border-emerald-600 p-4 rounded-2xl space-y-2 text-center shadow-retro-sm">
                <span className="text-xs font-black uppercase text-emerald-900 block">
                  📲 Instant WhatsApp Order Alert Sent!
                </span>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Click below to resend or view order alert on admin WhatsApp numbers:
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <a 
                    href={`https://wa.me/923206972422?text=${encodeURIComponent(lastWaMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 text-white font-black text-xs py-2.5 px-4 rounded-full border-2 border-sun-dark hover:bg-emerald-700 shadow-retro-sm flex items-center justify-center gap-2 uppercase"
                  >
                    <span>Send Order Alert to +92 320 6972422</span>
                  </a>
                  <a 
                    href={`https://wa.me/923086952333?text=${encodeURIComponent(lastWaMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-full border-2 border-sun-dark hover:bg-emerald-800 shadow-retro-sm flex items-center justify-center gap-2 uppercase"
                  >
                    <span>Send Order Alert to +92 308 6952333</span>
                  </a>
                </div>
              </div>

              <button 
                onClick={() => {
                  setOrderComplete(false);
                  setIsCheckoutStep(false);
                  onClose();
                }}
                className="w-full bg-sun-yellow text-sun-dark font-black py-3 px-6 rounded-full border-2 border-sun-dark shadow-retro uppercase text-xs"
              >
                Continue Shopping
              </button>
            </div>
          ) : isCheckoutStep ? (
            /* Checkout Form Step */
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <button 
                type="button" 
                onClick={() => setIsCheckoutStep(false)}
                className="text-xs font-bold text-amber-700 underline flex items-center gap-1 mb-2"
              >
                ← Back to Cart Items
              </button>

              <div className="bg-sun-yellow/20 border-2 border-sun-dark p-3 rounded-xl text-xs font-bold text-sun-dark flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>EXPRESS CASH ON DELIVERY (LEOPARDS SERVICE)</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase text-sun-dark mb-1">1️⃣ Full Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Ayesha Khan"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-sun-cream border-2 border-sun-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-sun-dark mb-1">2️⃣ Active Phone Number / WhatsApp</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. 0300-1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-sun-cream border-2 border-sun-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-sun-dark mb-1">3️⃣ City</label>
                  <select 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-sun-cream border-2 border-sun-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-medium"
                  >
                    {SORTED_PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-sun-dark mb-1">4️⃣ Complete Address</label>
                  <textarea 
                    required 
                    rows={3}
                    placeholder="House/Plot #, Street, Sector, Area..."
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-sun-cream border-2 border-sun-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-medium"
                  ></textarea>
                </div>
              </div>

              {/* Promo Code in Checkout */}
              <div className="bg-sun-sand p-3.5 rounded-xl border border-sun-dark space-y-2">
                <label className="block text-xs font-black uppercase text-sun-dark flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  <span>Creator Promo Code (10% OFF)</span>
                </label>

                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-100 border border-emerald-600 px-3 py-2 rounded-xl text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Code <strong>{appliedPromo}</strong> applied (-10% OFF)
                    </span>
                    <button 
                      type="button" 
                      onClick={handleRemovePromo}
                      className="text-red-600 hover:text-red-800 text-[11px] font-black underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. AYESHA10"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-sun-cream border-2 border-sun-dark rounded-xl px-3 py-1.5 text-xs uppercase font-black focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyPromo}
                      className="bg-sun-dark text-sun-yellow font-black text-xs px-4 py-1.5 rounded-xl border-2 border-sun-dark hover:bg-amber-900 transition-colors uppercase"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoErrorMsg && <p className="text-[11px] text-red-600 font-bold">{promoErrorMsg}</p>}
                {promoSuccessMsg && !promoErrorMsg && <p className="text-[11px] text-emerald-700 font-bold">{promoSuccessMsg}</p>}
              </div>

              {/* Cost Summary Breakdown */}
              <div className="bg-sun-sand p-4 rounded-xl border border-sun-dark space-y-1.5 text-xs font-bold text-sun-dark">
                <div className="flex justify-between"><span>Subtotal:</span><span>Rs. {subtotal.toLocaleString()}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-black">
                    <span>Creator Discount (10% OFF):</span>
                    <span>-Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between"><span>Leopards Shipping Fee:</span><span>Rs. {shippingCost}</span></div>
                <div className="flex justify-between text-sm font-black border-t border-sun-dark/20 pt-1 text-amber-800">
                  <span>Total COD Amount:</span>
                  <span>Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-sun-yellow text-sun-dark font-black py-4 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-base flex items-center justify-center gap-2"
              >
                <span>Confirm Order via COD</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            /* Cart Items List */
            <>
              {/* Delivery Speed Callout */}
              <div className="bg-sun-sand border-2 border-sun-dark p-3 rounded-2xl space-y-1.5 shadow-retro-sm">
                <div className="flex justify-between text-xs font-extrabold text-sun-dark">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    NATIONWIDE EXPRESS SHIPPING (3-4 DAYS)
                  </span>
                </div>
                <p className="text-[10px] text-sun-brown">
                  Delivery charges are flat Rs. 150 all over Pakistan via Leopards Courier Service.
                </p>
              </div>

              {/* Promo Code Input in Cart Drawer View */}
              <div className="bg-sun-cream border-2 border-sun-dark p-3.5 rounded-2xl shadow-retro-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-sun-dark flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    <span>Have a Creator / Promo Code?</span>
                  </span>
                  <span className="text-[10px] font-black bg-sun-yellow text-sun-dark px-2 py-0.5 rounded-full border border-sun-dark">
                    10% OFF
                  </span>
                </div>

                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-100 border border-emerald-600 px-3 py-2 rounded-xl text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Creator Code <strong>{appliedPromo}</strong> active!
                    </span>
                    <button 
                      type="button" 
                      onClick={handleRemovePromo}
                      className="text-red-600 hover:text-red-800 text-[11px] font-black underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter code (e.g. AYESHA10)"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-xs uppercase font-black focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                    <button 
                      type="submit"
                      className="bg-sun-dark text-sun-yellow font-black text-xs px-4 py-2 rounded-xl border-2 border-sun-dark hover:bg-amber-900 transition-colors uppercase shadow-retro-sm"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoErrorMsg && <p className="text-[11px] text-red-600 font-bold">{promoErrorMsg}</p>}
                {promoSuccessMsg && !promoErrorMsg && <p className="text-[11px] text-emerald-700 font-bold">{promoSuccessMsg}</p>}
              </div>

              {/* Smart Upselling Banner */}
              {showUpsell && (
                <div className="bg-gradient-to-r from-amber-100 to-amber-50 border-2 border-sun-dark p-4 rounded-2xl shadow-retro-sm space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600 animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-wider text-sun-dark">💡 COMPLETE KIT UPGRADE</span>
                  </div>
                  <p className="text-xs text-sun-brown font-semibold leading-relaxed">
                    Get all 3 essentials with the <strong>Koveria Glow Face Pack Kit</strong> (includes Face Pack + Night Toner + Rose Water) for <strong>Rs. 1,800</strong>!
                  </p>
                  <button 
                    onClick={handleUpgradeToKit}
                    className="w-full bg-sun-yellow text-sun-dark font-black text-xs py-2 rounded-full border-2 border-sun-dark hover:bg-amber-400 transition-colors uppercase"
                  >
                    Upgrade to Complete Full Kit (Rs. 1,800)
                  </button>
                </div>
              )}

              {cartItems.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <ShoppingBag className="w-16 h-16 mx-auto text-sun-dark opacity-30" />
                  <p className="font-bold text-sun-brown">Your cart is currently empty.</p>
                  <button 
                    onClick={onClose}
                    className="bg-sun-yellow text-sun-dark font-black text-xs px-6 py-3 rounded-full border-2 border-sun-dark shadow-retro-sm uppercase"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div 
                      key={item.product.id}
                      className="bg-sun-cream border-2 border-sun-dark p-3 rounded-2xl flex items-center gap-4 shadow-retro-sm"
                    >
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                        }}
                        className="w-16 h-16 object-cover rounded-xl border border-sun-dark flex-shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-display font-black text-sm text-sun-dark leading-tight">
                          {item.product.name}
                        </h4>
                        <div className="text-xs font-extrabold text-sun-dark">
                          Rs. {item.product.price.toLocaleString()}
                        </div>
                        
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center border border-sun-dark rounded-full bg-sun-sand">
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 hover:bg-sun-yellow rounded-l-full"
                            >
                              <Minus className="w-3 h-3 text-sun-dark" />
                            </button>
                            <span className="px-2 text-xs font-black">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 hover:bg-sun-yellow rounded-r-full"
                            >
                              <Plus className="w-3 h-3 text-sun-dark" />
                            </button>
                          </div>

                          <button 
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Subtotal & Proceed */}
        {!orderComplete && !isCheckoutStep && cartItems.length > 0 && (
          <div className="p-4 sm:p-6 bg-sun-cream border-t-4 border-sun-dark space-y-4">
            <div className="space-y-1.5 text-sm font-bold text-sun-dark">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-black">
                  <span>Creator Discount (10% OFF)</span>
                  <span>-Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-sun-brown">
                <span>Leopards Delivery</span>
                <span>Rs. {shippingCost}</span>
              </div>
              <div className="flex justify-between text-base font-black border-t border-sun-dark pt-2">
                <span>Total Amount</span>
                <span className="text-amber-800">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={() => setIsCheckoutStep(true)}
              className="w-full bg-sun-yellow text-sun-dark font-black py-4 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-base flex items-center justify-center gap-2"
            >
              <span>Proceed To COD Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
