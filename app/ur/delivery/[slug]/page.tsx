import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { deliveryCities, getCityBySlug } from "@/lib/delivery-locations";
import {
  buildUrduFaqs,
  buildUrduIntro,
  buildUrduSeoDescription,
  buildUrduSeoTitle,
  getUrduWhatsAppLink,
} from "@/lib/delivery-urdu";
import { absoluteUrl } from "@/lib/search-config";
import { MessageCircle, ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return deliveryCities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return { title: "Not Found" };

  return {
    title: buildUrduSeoTitle(city),
    description: buildUrduSeoDescription(city),
    alternates: {
      canonical: absoluteUrl(`/ur/delivery/${slug}/`),
      languages: {
        "en-PK": absoluteUrl(`/delivery/${slug}/`),
        "ur-PK": absoluteUrl(`/ur/delivery/${slug}/`),
      },
    },
  };
}

export default async function UrduDeliveryCityPage({ params }: Props) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return null;

  const intro = buildUrduIntro(city);
  const faqs = buildUrduFaqs(city);
  const wa = getUrduWhatsAppLink(city.name);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `پور ہربیکس — ${city.name}`,
    inLanguage: "ur-PK",
    areaServed: city.name,
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="min-h-screen bg-background" dir="rtl" lang="ur">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto text-right">
            <Link href="/ur/delivery/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
              تمام شہر <ChevronLeft size={18} className="rotate-180" />
            </Link>
            <Link href={`/delivery/${city.slug}/`} className="block text-primary text-sm mb-4" lang="en" dir="ltr">
              English: {city.name} delivery ←
            </Link>
            <h1 className="text-4xl font-bold mb-6">پور ہربیکس {city.name} میں ڈیلیوری</h1>
            <p className="text-muted-foreground mb-2">{city.province} · {city.deliveryDays}</p>
            {intro.map((html, i) => (
              <p key={i} className="text-lg text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: html }} />
            ))}
            <section className="mb-10 space-y-4">
              {faqs.map((f) => (
                <details key={f.q} className="glass-card rounded-xl p-5 text-right">
                  <summary className="font-bold cursor-pointer">{f.q}</summary>
                  <p className="mt-3 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </section>
            <a href={wa} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold">
              <MessageCircle size={20} /> {city.name} میں آرڈر کریں
            </a>
            <div className="mt-10 flex flex-wrap gap-4 text-sm">
              <Link href="/product/" className="text-primary font-bold">پروڈکٹ دیکھیں</Link>
              <Link href="/ingredients/" className="text-primary font-bold">32 جڑی بوٹیاں</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
