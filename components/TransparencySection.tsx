"use client";

import { ShieldCheck, Info, HeartPulse } from 'lucide-react';

export default function TransparencySection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold">The Hard Truth. No Games.</h2>
          <p className="text-lg text-muted-foreground">
            We know why you are here. We don&apos;t hide behind &quot;wellness&quot; jargon. You want results in the bedroom, 
            and we provide the herbal medical foundation to achieve them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <HeartPulse size={28} />
            </div>
            <h3 className="text-xl font-bold">Medical Intent</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Pure Herbex Ultra Force is specifically formulated for sexual enhancement. It works by increasing 
              nitric oxide production and improving blood flow to the genitals naturally.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-colors border-primary/20 bg-primary/5">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold">Proven Safety</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Unlike chemical pills that cause headaches and heart palpitations, our 100% herbal blend uses 
              32 concentrated extracts with zero documented side effects.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Info size={28} />
            </div>
            <h3 className="text-xl font-bold">What to Expect</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Increased girth, better stamina, and significantly improved confidence. This is not a &quot;quick fix&quot; 
              but a long-term nutritional foundation for male performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
