import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import TransparencySection from '@/components/TransparencySection';
import IngredientsGrid from '@/components/IngredientsGrid';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <Navbar />
        
        <HeroSection />
        
        <div id="transparency">
          <TransparencySection />
        </div>
        
        <div id="ingredients">
          <IngredientsGrid />
        </div>
        
        <section className="py-24 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-heading font-bold mb-8">Ready for Real Results?</h2>
            <div className="flex flex-col items-center gap-6">
              <a 
                href="https://wa.me/923001234567?text=Assalam%20o%20Alaikum,%20I%20want%20to%20order%20Pure%20Herbex%20Ultra%20Force%20(Rs.%203,000)."
                className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(16,115,84,0.3)]"
              >
                Order Rs. 3,000 Bottle via WhatsApp
              </a>
              <div className="flex gap-8 text-sm text-muted-foreground font-medium">
                <span>✅ Cash on Delivery</span>
                <span>✅ Discreet Packaging</span>
                <span>✅ All Pakistan</span>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </SmoothScroll>
  );
}
