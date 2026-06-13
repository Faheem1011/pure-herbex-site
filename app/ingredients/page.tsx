import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { ingredients } from "@/lib/ingredients-data";
import { absoluteUrl } from "@/lib/search-config";

export const metadata: Metadata = {
  title: "32 Herbal Ingredients | Pure Herbex Ultra Force Formula",
  description:
    "Explore all 32 medical-grade herbs in Pure Herbex Ultra Force — Ashwagandha, Shilajit, Tribulus, Saffron, Musli Sufaid & more. Science-backed male vitality for Pakistan.",
  alternates: { canonical: absoluteUrl("/ingredients/") },
  openGraph: {
    title: "32 Herbal Ingredients | Pure Herbex",
    url: absoluteUrl("/ingredients/"),
    siteName: "Pure Herbex",
    type: "website",
  },
};

export default function IngredientsHubPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pure Herbex Ultra Force — 32 Ingredients",
    numberOfItems: ingredients.length,
    itemListElement: ingredients.map((ing, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: ing.name,
      url: absoluteUrl(`/ingredients/${ing.slug}/`),
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <header className="max-w-3xl mb-16">
              <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
                32 Potent <span className="text-primary">Herbal Ingredients</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Every herb in Pure Herbex Ultra Force is documented here — benefits, traditional use,
                and role in our Rs. 3,000 medical-grade formula shipped COD across Pakistan.
              </p>
              <Link href="/product/" className="inline-block mt-6 text-primary font-bold hover:underline">
                View full product →
              </Link>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ingredients.map((ing) => (
                <Link
                  key={ing.slug}
                  href={`/ingredients/${ing.slug}/`}
                  className="group glass-card rounded-2xl p-5 hover:border-primary/50 transition-all"
                >
                  {ing.image && (
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <Image src={ing.image} alt={ing.name} fill className="object-contain" />
                    </div>
                  )}
                  <h2 className="font-bold text-sm text-center group-hover:text-primary transition-colors">{ing.name}</h2>
                  <p className="text-[10px] text-muted-foreground text-center mt-1 uppercase tracking-wide">{ing.category}</p>
                  <p className="text-xs text-muted-foreground text-center mt-2 line-clamp-2">{ing.benefit}</p>
                </Link>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
