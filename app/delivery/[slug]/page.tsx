import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  deliveryCities,
  getCityBySlug,
  getNearbyCityLinks,
  getWhatsAppOrderLink,
} from "@/lib/delivery-locations";
import {
  buildCityFaqs,
  buildCityIntroParagraphs,
  buildCitySeoDescription,
  buildCitySeoTitle,
} from "@/lib/delivery-content";
import { getAreasByCity } from "@/lib/delivery-areas";
import { absoluteUrl } from "@/lib/search-config";
import {
  MapPin,
  Clock,
  Package,
  Shield,
  MessageCircle,
  ChevronLeft,
  Truck,
  CheckCircle,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return deliveryCities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return { title: "City Not Found" };

  const title = buildCitySeoTitle(city);
  const description = buildCitySeoDescription(city);

  return {
    title,
    description,
    keywords: city.seoKeywords.join(", "),
    alternates: {
      canonical: absoluteUrl(`/delivery/${slug}/`),
      languages: {
        "en-PK": absoluteUrl(`/delivery/${slug}/`),
        "ur-PK": absoluteUrl(`/ur/delivery/${slug}/`),
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/delivery/${slug}/`),
      siteName: "Pure Herbex",
      type: "website",
      locale: "en_PK",
    },
  };
}

export default async function DeliveryCityPage({ params }: Props) {
  const { slug } = await params;
  const city = getCityBySlug(slug);

  if (!city) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">City Not Found</h1>
        <Link href="/delivery/" className="text-primary hover:underline flex items-center gap-2">
          <ChevronLeft size={18} /> All delivery areas
        </Link>
      </div>
    );
  }

  const introParagraphs = buildCityIntroParagraphs(city);
  const faqs = buildCityFaqs(city);
  const nearbyCities = getNearbyCityLinks(city);
  const cityAreas = getAreasByCity(city.slug);
  const waLink = getWhatsAppOrderLink(city.name);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Pure Herbex",
    image: "https://pureherbex.com/assets/images/product-bottle.png",
    url: "https://pureherbex.com",
    telephone: "+923160924151",
    priceRange: "Rs. 3000",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Okara",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: city.province,
      },
    },
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: "Pure Herbex Ultra Force",
        url: "https://pureherbex.com/product/",
      },
      price: "3000",
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      acceptedPaymentMethod: "https://schema.org/Cash",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pureherbex.com/" },
      { "@type": "ListItem", position: 2, name: "Delivery", item: "https://pureherbex.com/delivery/" },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: `https://pureherbex.com/delivery/${city.slug}/`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/delivery/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
            >
              <ChevronLeft size={18} /> All {deliveryCities.length}+ delivery cities
            </Link>

            <header className="mb-12">
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase">
                  <MapPin size={14} /> {city.province}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase text-muted-foreground">
                  <Clock size={14} /> {city.deliveryDays}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase text-muted-foreground">
                  <Truck size={14} /> COD Available
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight mb-6">
                Pure Herbex Delivery in {city.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                Herbal stamina & vitality — Rs. 3,000 Cash on Delivery, discreet packaging, shipped from Okara to{" "}
                {city.name} and surrounding areas.
              </p>
              <Link href={`/ur/delivery/${city.slug}/`} className="inline-block mt-4 text-primary text-sm font-semibold hover:underline" hrefLang="ur">
                اردو میں پڑھیں — {city.name} ڈیلیوری ←
              </Link>
            </header>

            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {[
                { icon: Package, label: "Discreet box", sub: "No outside branding" },
                { icon: Shield, label: "Rs. 3,000 COD", sub: "Pay on delivery" },
                { icon: CheckCircle, label: "32-herb formula", sub: "Medical-grade" },
              ].map((item) => (
                <div key={item.label} className="glass-card rounded-xl p-4 text-center">
                  <item.icon className="mx-auto text-primary mb-2" size={24} />
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>

            <article className="prose prose-invert prose-emerald max-w-none mb-12">
              {introParagraphs.map((html, i) => (
                <p
                  key={i}
                  className="text-lg text-muted-foreground leading-relaxed mb-6"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
            </article>

            <section className="mb-12 p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Areas we cover near {city.name}</h2>
              <div className="flex flex-wrap gap-2">
                {city.nearbyAreas.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold mb-6">How to order in {city.name}</h2>
              <ol className="space-y-4 text-muted-foreground">
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">1</span>
                  <span>Message us on WhatsApp with your name, full {city.name} address, and phone number.</span>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">2</span>
                  <span>We confirm your order and dispatch from Okara — typically within the same business day.</span>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">3</span>
                  <span>Receive your discreet parcel in {city.deliveryDays}. Pay Rs. 3,000 cash to the courier.</span>
                </li>
              </ol>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold mb-6">Frequently asked — {city.name}</h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group glass-card rounded-xl p-5 open:border-primary/30"
                  >
                    <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                      {faq.question}
                      <span className="text-primary text-xl group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-center">
              <h2 className="text-2xl font-bold mb-3">Order for {city.name} now</h2>
              <p className="text-muted-foreground mb-6">Rs. 3,000 · Cash on Delivery · Discreet packaging</p>
              <a
                href={waLink}
                className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:scale-105 transition-transform"
              >
                <MessageCircle size={22} /> WhatsApp Order — {city.name}
              </a>
            </section>

            {cityAreas.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">Neighbourhoods in {city.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {cityAreas.map((area) => (
                    <Link
                      key={area.slug}
                      href={`/delivery/area/${area.slug}/`}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 text-sm transition-all"
                    >
                      {area.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-12">
              <h2 className="text-xl font-bold mb-4">More delivery locations</h2>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map((near) => (
                  <Link
                    key={near.slug}
                    href={`/delivery/${near.slug}/`}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 hover:text-primary text-sm transition-all"
                  >
                    {near.name}
                  </Link>
                ))}
              </div>
            </section>

            <section className="p-6 rounded-2xl border border-white/10">
              <p className="text-muted-foreground mb-4">
                Learn more about the formula before you order:
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/product/" className="text-primary font-bold hover:underline">
                  View Ultra Force product →
                </Link>
                <Link href="/blog/mens-health-pakistan-vitality-guide/" className="text-primary font-bold hover:underline">
                  Men&apos;s health guide →
                </Link>
                <Link href="/reviews/" className="text-primary font-bold hover:underline">
                  Customer reviews →
                </Link>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
