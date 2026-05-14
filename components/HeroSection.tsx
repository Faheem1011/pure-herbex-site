"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium animate-fade-in">
            <span className="relative flex h-2 w-2 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            #1 Natural Wellness Solution in Pakistan
          </div>

          <h1 className="text-5xl lg:text-7xl font-heading font-bold leading-tight tracking-tighter">
            Ultimate Sexual <br />
            <span className="text-primary text-glow italic">Performance.</span> <br />
            <span className="text-accent text-glow-gold">Naturally.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            No sugar-coating. No fake promises. Pure Herbex Ultra Force is a potent medical-grade herbal formula 
            specifically engineered for <span className="text-foreground font-semibold underline decoration-primary/50">Genital Enhancement</span>, 
            natural stamina, and explosive vitality.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="https://wa.me/923001234567?text=Assalam%20o%20Alaikum,%20I%20want%20to%20order%20Pure%20Herbex%20Ultra%20Force%20(Rs.%203,000)."
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,115,84,0.4)]"
            >
              Order Now via WhatsApp
            </Link>
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-bold text-foreground">Rs. 3,000</span>
              <span className="text-xs text-muted-foreground">✅ Free Delivery Across Pakistan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-border">
            <div>
              <div className="text-primary font-bold text-xl">32+</div>
              <div className="text-xs text-muted-foreground">Potent Herbs</div>
            </div>
            <div>
              <div className="text-primary font-bold text-xl">100%</div>
              <div className="text-xs text-muted-foreground">No Side Effects</div>
            </div>
            <div>
              <div className="text-primary font-bold text-xl">COD</div>
              <div className="text-xs text-muted-foreground">Cash on Delivery</div>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div className="absolute w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(16,115,84,0.1)_0%,transparent_70%)] animate-pulse" />
          <div className="relative z-10 animate-float">
            <Image 
              src="/assets/images/product-bottle.png" 
              alt="Pure Herbex Ultra Force Product Bottle" 
              width={500} 
              height={800} 
              priority
              className="drop-shadow-[0_0_50px_rgba(229,113,0,0.2)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
