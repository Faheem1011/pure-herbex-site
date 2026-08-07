import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderId: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-sun-sand min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Hero */}
        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-8 sm:p-12 shadow-retro-lg text-center space-y-4">
          <div className="inline-flex items-center gap-2 badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black px-4 py-1.5 rounded-full">
            <Mail className="w-4 h-4" /> WE ARE HERE TO HELP YOU GLOW
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-sun-dark">
            Contact <span className="text-amber-700">Pure Herbex Support</span>
          </h1>

          <p className="text-sm sm:text-base font-medium text-sun-brown max-w-2xl mx-auto leading-relaxed">
            Have questions about your order, custom skincare routine recommendations, or nationwide COD delivery? Get in touch with our botanical beauty specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Contact Cards */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-sun-cream border-3 border-sun-dark rounded-3xl p-6 shadow-retro space-y-4">
              <h3 className="font-display font-black text-xl uppercase text-sun-dark flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-700" /> Direct Support Lines
              </h3>

              <div className="space-y-4 text-xs font-bold text-sun-dark">
                <div className="flex items-start gap-3 p-3 bg-sun-sand rounded-2xl border border-sun-dark/20">
                  <Mail className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black uppercase text-amber-900">Email Support</span>
                    <a href="mailto:support@pureherbex.com" className="text-sun-dark hover:underline">support@pureherbex.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-sun-sand rounded-2xl border border-sun-dark/20">
                  <Phone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black uppercase text-emerald-900">WhatsApp / Helpline</span>
                    <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                      +92 300 0000000 (WhatsApp Active)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-sun-sand rounded-2xl border border-sun-dark/20">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black uppercase text-amber-900">Support Hours</span>
                    <span className="text-sun-brown">Monday – Saturday: 9:00 AM – 8:00 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-sun-sand rounded-2xl border border-sun-dark/20">
                  <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black uppercase text-amber-900">Botanical Lab Location</span>
                    <span className="text-sun-brown">Pure Herbex Artisanal Labs, Lahore, Pakistan</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sun-yellow p-6 rounded-3xl border-3 border-sun-dark shadow-retro text-xs font-bold text-sun-dark space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-950 uppercase">
                <ShieldCheck className="w-5 h-5" /> Nationwide Delivery Promise
              </div>
              <p className="text-sun-brown leading-relaxed">
                All orders are dispatched within 24 hours via Leopards Courier with live tracking & Cash on Delivery.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-sun-cream border-3 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro lg:col-span-2">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <h3 className="font-display font-black text-3xl uppercase text-sun-dark">
                  Message Sent Successfully!
                </h3>
                <p className="text-sm font-bold text-sun-brown max-w-md mx-auto">
                  Thank you for reaching out to Pure Herbex. Our botanical customer support team will respond to your email within 2 to 4 business hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="bg-sun-yellow text-sun-dark font-black px-6 py-2.5 rounded-full border-2 border-sun-dark uppercase text-xs tracking-wider"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-display font-black text-2xl uppercase text-sun-dark mb-4">
                  Send Us A Message
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-sun-dark">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ayesha Khan"
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-2xl px-4 py-2.5 text-sm font-medium text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-sun-dark">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ayesha@example.com"
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-2xl px-4 py-2.5 text-sm font-medium text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-sun-dark">Phone / WhatsApp Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0300 1234567"
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-2xl px-4 py-2.5 text-sm font-medium text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-sun-dark">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      placeholder="e.g. PK-9842"
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-2xl px-4 py-2.5 text-sm font-medium text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-sun-dark">Inquiry Subject *</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-sun-sand border-2 border-sun-dark rounded-2xl px-4 py-2.5 text-sm font-bold text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Skincare Consultation">Skincare Routine Consultation</option>
                    <option value="Order Tracking & Shipping">Order Tracking & Shipping Issue</option>
                    <option value="Wholesale & Bulk Orders">Wholesale & Bulk Orders</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-sun-dark">Your Message *</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your question or order query here..."
                    className="w-full bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 text-sm font-medium text-sun-dark focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-sun-yellow text-sun-dark font-black py-3.5 rounded-full border-2 border-sun-dark uppercase text-xs tracking-wider shadow-retro-sm hover:bg-amber-400 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Send className="w-4 h-4" /> Submit Inquiry
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
