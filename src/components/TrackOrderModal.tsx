import React, { useState, useEffect } from 'react';
import { Search, MapPin, PackageCheck, Truck, Clock, X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { findShipment, trackCourierShipment, CourierShipment, getCustomerTrackingDisplay } from '../services/courier/runCourierService';
import { fetchLiveOrders } from '../services/supabase';
import { Order } from '../types';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingCode?: string;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose, initialTrackingCode = '' }) => {
  const [query, setQuery] = useState(initialTrackingCode);
  const [shipment, setShipment] = useState<CourierShipment | null>(null);
  const [matchingOrder, setMatchingOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTrackingCode) {
      setQuery(initialTrackingCode);
      performTrack(initialTrackingCode);
    }
  }, [initialTrackingCode, isOpen]);

  if (!isOpen) return null;

  const performTrack = async (searchQuery: string) => {
    const clean = searchQuery.trim();
    if (!clean) return;
    setHasSearched(true);
    setLoading(true);

    try {
      // 1. Check dedicated courier shipment store
      let shp = findShipment(clean);
      if (shp) {
        // Sync latest status from RUN API
        const updated = await trackCourierShipment(shp.runTrackingNo);
        if (updated) shp = updated;
        setShipment(shp);
      } else {
        // 2. Check supabase orders
        const ordersData = await fetchLiveOrders();
        const foundOrder = (ordersData.orders || []).find(o => 
          o.id.toUpperCase() === clean.toUpperCase() ||
          o.trackingNumber.toUpperCase() === clean.toUpperCase() ||
          (o.phone && o.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, ''))
        );

        if (foundOrder) {
          setMatchingOrder(foundOrder);
          // Auto generate or check shipment
          const generatedShp = findShipment(foundOrder.id) || findShipment(foundOrder.trackingNumber);
          if (generatedShp) {
            setShipment(generatedShp);
          } else {
            setShipment({
              id: 'shp-' + foundOrder.id,
              orderId: foundOrder.id,
              courierProvider: 'RUN',
              courierGateway: 'Leopard',
              runTrackingNo: foundOrder.trackingNumber,
              thirdPartyTrackingNo: foundOrder.trackingNumber.startsWith('LEO') ? foundOrder.trackingNumber : 'LEO-' + foundOrder.trackingNumber.replace(/[^0-9]/g, ''),
              thirdPartyName: 'Leopard Courier',
              serviceType: 'Overnight',
              originCity: 'Lahore',
              destinationCity: foundOrder.city || 'Lahore',
              receiverName: foundOrder.fullName,
              receiverPhone: foundOrder.phone,
              receiverAddress: foundOrder.address,
              pieces: foundOrder.items.length,
              weight: 1,
              codAmount: foundOrder.totalAmount,
              status: foundOrder.status || 'Booked via Leopards',
              statusCode: 'NB-01',
              createdAt: foundOrder.orderDate,
              updatedAt: foundOrder.orderDate,
              lastSyncedAt: new Date().toISOString(),
              trackingEvents: [
                {
                  id: 'evt-1',
                  trackingNo: foundOrder.trackingNumber,
                  status: 'New Booked',
                  statusCode: 'NB-01',
                  eventTime: foundOrder.orderDate,
                  location: 'Lahore Hub',
                  description: 'Parcel booked with Leopard Courier Gateway via RUN Couriers COD.',
                  source: 'RUN_API'
                }
              ]
            });
          }
        } else {
          setShipment(null);
          setMatchingOrder(null);
        }
      }
    } catch (err) {
      console.warn('Tracking error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performTrack(query);
  };

  const trackingInfo = shipment ? getCustomerTrackingDisplay(shipment) : null;

  // Timeline progression steps
  const steps = [
    { title: 'Order Booked', desc: 'Leopard Courier Gateway Assigned', done: true },
    { title: 'Picked Up', desc: 'Dispatched from Lahore Botanical Lab', done: shipment?.status !== 'Pending' },
    { title: 'In Transit', desc: 'Moving to Destination Hub', done: ['Dispatched', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment?.status || '') },
    { title: 'Out for Delivery', desc: 'With Leopards Courier Rider', done: ['Out for Delivery', 'Delivered'].includes(shipment?.status || '') },
    { title: 'Delivered', desc: 'Cash Collected & Received', done: shipment?.status === 'Delivered' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-retro-lg relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-sun-sand p-2 rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors z-10"
        >
          <X className="w-5 h-5 text-sun-dark" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black px-3 py-1 rounded-full">
            <Truck className="w-3.5 h-3.5" /> RUN COURIERS & LEOPARD COD TRACKING
          </div>
          <h2 className="text-3xl font-black uppercase text-sun-dark tracking-tight">
            TRACK YOUR <span className="text-amber-600">PARCEL</span>
          </h2>
          <p className="text-xs text-sun-brown font-semibold">
            Enter your Order ID (e.g. ORD-XXXX) or Leopard Tracking Number.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Tracking # or Order ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-sun-sand border-2 border-sun-dark rounded-full px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-bold uppercase"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-sun-yellow text-sun-dark font-black px-6 py-3 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-xs flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-4 h-4" /> {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Results Box */}
        {hasSearched && (
          shipment ? (
            <div className="bg-sun-sand border-2 border-sun-dark p-5 rounded-2xl space-y-4 shadow-retro-sm text-left">
              {/* Primary Tracking Number Box */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sun-dark/20 pb-3">
                <div>
                  <div className="text-[10px] font-black uppercase text-amber-900">Courier Provider</div>
                  <div className="font-display font-black text-base text-sun-dark">
                    🐆 {trackingInfo?.courierName || 'Leopard Courier'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-amber-900">Leopard Tracking No</div>
                  <div className="font-mono font-black text-sm text-emerald-800 bg-sun-cream px-2.5 py-0.5 rounded-lg border border-sun-dark/20 inline-block">
                    {trackingInfo?.primaryNumber}
                  </div>
                </div>
              </div>

              {/* Order Meta Info */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-sun-dark bg-sun-cream/60 p-3 rounded-xl border border-sun-dark/10">
                <div>
                  <span className="text-sun-brown text-[10px] block uppercase">Recipient:</span>
                  <span>{shipment.receiverName}</span>
                </div>
                <div>
                  <span className="text-sun-brown text-[10px] block uppercase">Destination City:</span>
                  <span>{shipment.destinationCity}</span>
                </div>
                <div>
                  <span className="text-sun-brown text-[10px] block uppercase">COD Amount:</span>
                  <span className="text-emerald-800 font-black">Rs. {shipment.codAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-sun-brown text-[10px] block uppercase">RUN System Ref:</span>
                  <span className="font-mono text-[11px]">{shipment.runTrackingNo}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between bg-sun-yellow/30 p-2.5 rounded-xl border border-sun-dark/15">
                <span className="text-xs font-black uppercase text-amber-950">Current Status:</span>
                <span className="bg-sun-yellow text-sun-dark border border-sun-dark text-xs font-black px-3 py-1 rounded-full uppercase">
                  {shipment.status}
                </span>
              </div>

              {/* Step-by-Step Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="font-display font-black text-xs uppercase text-sun-dark tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" /> Live Courier Timeline
                </h4>
                
                <div className="space-y-2 pl-2 border-l-2 border-sun-dark/30 ml-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="relative pl-4 text-xs">
                      <div className={`absolute -left-[13px] top-0.5 w-3.5 h-3.5 rounded-full border border-sun-dark ${
                        step.done ? 'bg-emerald-500' : 'bg-sun-cream'
                      }`}></div>
                      <div className={`font-black uppercase ${step.done ? 'text-sun-dark' : 'text-sun-brown/60'}`}>
                        {step.title}
                      </div>
                      <div className="text-[11px] text-sun-brown">{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-[11px] text-sun-brown font-medium pt-2 border-t border-sun-dark/15 text-center">
                For urgent delivery inquiries or address changes, WhatsApp us on <strong>+92 320 6972422</strong>.
              </div>
            </div>
          ) : (
            <div className="bg-sun-sand border-2 border-sun-dark p-6 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-700 mx-auto" />
              <p className="text-xs font-bold text-sun-dark">No shipment found matching "{query}".</p>
              <p className="text-[11px] text-sun-brown">
                Please verify your Leopard tracking number or Order ID and try again.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
};
