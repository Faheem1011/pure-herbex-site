"use client";

import Image from 'next/image';
import Link from 'next/link';

const ingredients = [
  { name: 'Ashwagandha', slug: 'ashwagandha', image: '/assets/images/ingredients/ashwagandha.png', benefit: 'Cortisol reduction & Stamina boost' },
  { name: 'Pure Saffron', slug: 'saffron', image: '/assets/images/ingredients/saffron.png', benefit: 'Natural aphrodisiac & Libido enhancement' },
  { name: 'Korean Gensing', slug: 'korean-ginseng', image: '/assets/images/ingredients/gensing.png', benefit: 'Vitality & Blood flow optimization' },
  { name: 'Musli Sufaid', slug: 'safed-musli', image: '/assets/images/ingredients/musli-sufaid.png', benefit: 'Natural muscle growth & Strength' },
  { name: 'Nutmeg', slug: 'nutmeg', image: '/assets/images/ingredients/nutmeg.png', benefit: 'Long-lasting performance support' },
  { name: 'Lajwanti', slug: 'lajwanti', image: '/assets/images/ingredients/lajwanti.png', benefit: 'Traditional sensitivity control' },
];

export default function IngredientsGrid() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-6 text-glow">Nature&apos;s Medicine.</h2>
            <p className="text-muted-foreground">
              We sourced 32 potent herbal extracts across Asia and the Middle East to create the ultimate 
              performance synergy. No fillers, just concentrated results.
            </p>
          </div>
          <div className="px-6 py-2 rounded-full border border-accent/30 text-accent text-sm font-semibold">
            <Link href="/ingredients/" className="hover:text-primary transition-colors">32 Concentrated Herbs →</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ingredients.map((item) => (
            <Link
              key={item.slug}
              href={`/ingredients/${item.slug}/`}
              className="group relative glass-card p-4 rounded-xl flex flex-col items-center text-center hover:border-primary/50 transition-all hover:-translate-y-2"
            >
              <div className="relative w-24 h-24 mb-4">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  fill 
                  className="object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h4 className="font-bold text-sm mb-1">{item.name}</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">
                {item.benefit}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
