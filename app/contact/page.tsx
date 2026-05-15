import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import { MessageSquare, Phone, Mail, MapPin, Facebook, Instagram, Music2 } from 'lucide-react';

export default function ContactPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <Navbar />
        
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl lg:text-6xl font-heading font-bold text-glow">Get in Touch.</h1>
                <p className="text-xl text-muted-foreground">Have questions? We are here to provide clear, direct answers.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="glass-card p-10 rounded-3xl space-y-8">
                    <h3 className="text-2xl font-bold">Send us a Message</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none" placeholder="Your Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none" placeholder="03XX XXXXXXX" />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">How can we help?</label>
                        <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none h-32" placeholder="Tell us what you need..."></textarea>
                      </div>
                    </div>
                    <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(16,115,84,0.3)]">
                      Submit Feedback
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <a href="https://www.facebook.com/profile.php?id=61589767019589" target="_blank" rel="noopener noreferrer" className="flex-1 glass-card p-6 rounded-2xl flex items-center justify-center gap-3 hover:border-primary transition-colors">
                      <Facebook size={20} className="text-primary" />
                      <span className="font-bold">Facebook</span>
                    </a>
                    <a href="https://www.instagram.com/pure.herbex9616053/" target="_blank" rel="noopener noreferrer" className="flex-1 glass-card p-6 rounded-2xl flex items-center justify-center gap-3 hover:border-primary transition-colors">
                      <Instagram size={20} className="text-primary" />
                      <span className="font-bold">Instagram</span>
                    </a>
                    <a href="https://www.tiktok.com/@pureherbex8" target="_blank" rel="noopener noreferrer" className="flex-1 glass-card p-6 rounded-2xl flex items-center justify-center gap-3 hover:border-primary transition-colors">
                      <Music2 size={20} className="text-primary" />
                      <span className="font-bold">TikTok</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-8 rounded-3xl space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Phone size={20} />
                      </div>
                      <div>
                        <div className="font-bold">Call / WhatsApp</div>
                        <div className="text-sm text-muted-foreground">+92 316 0924151</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Mail size={20} />
                      </div>
                      <div>
                        <div className="font-bold">Email Support</div>
                        <div className="text-sm text-muted-foreground">info@pureherbex.com</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="font-bold">Location</div>
                        <div className="text-sm text-muted-foreground">Okara, Pakistan</div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8 rounded-3xl bg-primary/5 border-primary/20 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <MessageSquare size={20} />
                      <span>Instant Help</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Most customers get a response within 10 minutes on WhatsApp.</p>
                    <a href="https://wa.me/923160924151" className="block text-center py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary/20 transition-colors">
                      Open WhatsApp
                    </a>
                  </div>
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
