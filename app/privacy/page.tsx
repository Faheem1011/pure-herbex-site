import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import { Shield, Lock, EyeOff, FileText, Mail, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pure Herbex',
  description: 'Privacy Policy and customer confidentiality guidelines for Pure Herbex Pakistan. Learn how we guarantee 100% order discretion and secure data handling.',
  alternates: {
    canonical: 'https://pureherbex.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen text-foreground selection:bg-primary/30">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] -z-10" />
          <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] -z-10" />
          
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-bold tracking-wide uppercase">
                <Shield size={16} />
                Security & Confidentiality
              </div>
              <h1 className="text-5xl lg:text-7xl font-heading font-bold text-glow leading-tight">
                Discretion & Security.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We believe in radical transparency regarding our ingredients, and absolute confidentiality regarding your personal data and orders.
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* Highlight Card: Discretion Guarantee */}
              <div className="glass-card p-8 md:p-10 rounded-3xl border-primary/30 bg-primary/5 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-[0_0_20px_rgba(16,115,84,0.4)]">
                  <Lock size={32} />
                </div>
                <div className="space-y-3 relative z-10">
                  <h3 className="text-2xl font-bold">100% Discreet Packaging Guarantee</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Because we specialize in male performance and wellness, we understand the importance of privacy. Every single order dispatched from our facility is enclosed in a plain, unmarked envelope or brown cardboard box with zero mention of &quot;Pure Herbex&quot;, &quot;Ultra Force&quot;, or &quot;Sexual Enhancement&quot;. The shipping label only lists our discrete corporate sender initials and address.
                  </p>
                </div>
              </div>

              {/* Standard Policy Content */}
              <div className="glass-card p-10 rounded-3xl space-y-10">
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-white/5 pb-4">
                    <FileText size={20} className="text-primary" />
                    1. Information We Collect
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To successfully process and deliver your orders within Pakistan, we collect limited personal details. This information is gathered solely when you place an order, contact our support team, or engage in clinical consultations:
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-2 text-muted-foreground">
                    <li><strong className="text-foreground">Identity Information:</strong> Full name.</li>
                    <li><strong className="text-foreground">Contact & Delivery Information:</strong> Delivery address, mobile phone number (required by local courier partners like TCS/Leopards for Cash on Delivery coordination).</li>
                    <li><strong className="text-foreground">Inquiry Details:</strong> Information or health concerns you voluntarily share when chatting with our wellness team via WhatsApp.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-white/5 pb-4">
                    <EyeOff size={20} className="text-primary" />
                    2. How We Protect Your Data
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Your personal information is never traded, leased, or sold to third-party marketing companies. Access to your order details is strictly restricted to specialized personnel handling packaging and shipment logistics.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    All online communication is routed through secure SSL/TLS channels, and offline digital logs are securely stored behind dual-factor authentication layers to prevent unauthorized leakage.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-white/5 pb-4">
                    <Shield size={20} className="text-primary" />
                    3. Cookies & Tracking Technologies
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We utilize technical cookies and analytics utilities (such as Google Analytics) to gather aggregated, non-identifying traffic information. This allows us to measure page speeds, optimize device compatibility, and monitor overall search rankings. You can choose to reject cookies in your browser settings without affecting your ability to browse the site.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-white/5 pb-4">
                    <Mail size={20} className="text-primary" />
                    4. Data Deletion Rights
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe you have complete ownership of your medical and order history. If you wish to purge your phone number, delivery address, or inquiry history from our active records post-delivery, simply drop an email to <a href="mailto:info@pureherbex.com" className="text-primary hover:underline font-semibold">info@pureherbex.com</a> or message us on WhatsApp. We will delete all logs within 24 hours.
                  </p>
                </div>

              </div>

              {/* Support CTA */}
              <div className="glass-card p-8 rounded-3xl bg-muted/10 text-center space-y-6">
                <h3 className="text-xl font-bold">Have questions about our privacy standards?</h3>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Our customer care officers are available on WhatsApp for safe, secure, and fully confidential support regarding orders, tracking, and product queries.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="https://wa.me/923160924151" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(16,115,84,0.3)]"
                  >
                    <MessageSquare size={18} />
                    Confidential Chat
                  </a>
                  <a 
                    href="mailto:info@pureherbex.com" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 hover:border-primary hover:text-primary rounded-xl font-bold transition-all"
                  >
                    <Mail size={18} />
                    Email Support
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </main>
    </SmoothScroll>
  );
}
