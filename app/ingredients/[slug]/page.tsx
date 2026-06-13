import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  ingredients,
  getIngredientBySlug,
  getRelatedIngredients,
} from "@/lib/ingredients-data";
import { absoluteUrl } from "@/lib/search-config";
import { getWhatsAppOrderLink } from "@/lib/delivery-locations";
import { ChevronLeft, MessageCircle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ingredients.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ing = getIngredientBySlug(slug);
  if (!ing) return { title: "Ingredient Not Found" };

  const title = `${ing.name} Benefits for Men | Pure Herbex Ultra Force`;
  const description = `${ing.excerpt} Learn how ${ing.name} (${ing.urduName}) works in Pure Herbex — Rs. 3,000 COD Pakistan.`;

  return {
    title,
    description,
    keywords: ing.seoKeywords.join(", "),
    alternates: { canonical: absoluteUrl(`/ingredients/${slug}/`) },
    openGraph: { title, description, url: absoluteUrl(`/ingredients/${slug}/`), type: "article" },
  };
}

export default async function IngredientPage({ params }: Props) {
  const { slug } = await params;
  const ing = getIngredientBySlug(slug);
  if (!ing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/ingredients/" className="text-primary">← All ingredients</Link>
      </div>
    );
  }

  const related = getRelatedIngredients(ing);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${ing.name} — Pure Herbex Ingredient Guide`,
    description: ing.description,
    url: absoluteUrl(`/ingredients/${ing.slug}/`),
    inLanguage: "en-PK",
    author: { "@type": "Organization", name: "Pure Herbex" },
    about: { "@type": "Thing", name: ing.latinName },
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <Link href="/ingredients/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
              <ChevronLeft size={18} /> All 32 ingredients
            </Link>
            <header className="mb-10">
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">{ing.category} · {ing.latinName}</p>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">{ing.name}</h1>
              <p className="text-2xl text-muted-foreground font-arabic" dir="rtl">{ing.urduName}</p>
              {ing.image && (
                <div className="relative w-32 h-32 mt-6">
                  <Image src={ing.image} alt={ing.name} fill className="object-contain" />
                </div>
              )}
            </header>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">{ing.description}</p>
            <h2 className="text-xl font-bold mb-4">Key benefits</h2>
            <ul className="space-y-3 mb-10">
              {ing.benefits.map((b) => (
                <li key={b} className="flex gap-3 text-muted-foreground">
                  <span className="text-primary">✓</span> {b}
                </li>
              ))}
            </ul>
            <section className="p-6 rounded-2xl bg-primary/10 border border-primary/20 mb-10">
              <p className="mb-4">
                <strong>{ing.name}</strong> is part of the complete <Link href="/product/" className="text-primary font-bold hover:underline">Pure Herbex Ultra Force</Link> 32-herb matrix — Rs. 3,000 COD nationwide.
              </p>
              <a href={getWhatsAppOrderLink("Pakistan")} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold">
                <MessageCircle size={18} /> Order on WhatsApp
              </a>
            </section>
            {related.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Related ingredients</h2>
                <div className="flex flex-wrap gap-2">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/ingredients/${r.slug}/`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 text-sm">
                      {r.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
