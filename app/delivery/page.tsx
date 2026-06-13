import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { deliveryCities, PROVINCES, getCitiesByProvince, getWhatsAppOrderLink } from "@/lib/delivery-locations";
import { deliveryAreas } from "@/lib/delivery-areas";
import { MapPin, Truck, Package, Shield, MessageCircle, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Delivery All Over Pakistan | Pure Herbex COD — 82 Cities",
  description:
    "Pure Herbex Ultra Force ships nationwide — Lahore, Karachi, Islamabad, Peshawar, Quetta, Gilgit, AJK & 82 cities. Rs. 3,000 Cash on Delivery, discreet packaging from Okara.",
  alternates: { canonical: "https://pureherbex.com/delivery/" },
  openGraph: {
    title: "Nationwide Delivery | Pure Herbex Pakistan",
    description: "82 cities covered. COD, discreet packaging, all provinces.",
    url: "https://pureherbex.com/delivery/",
    siteName: "Pure Herbex",
    type: "website",
  },
};

export default function DeliveryHubPage() {
  const totalCities = deliveryCities.length;

  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pure Herbex Delivery — All Pakistan",
    description: "Nationwide Cash on Delivery for Pure Herbex Ultra Force across 70+ Pakistani cities.",
    url: "https://pureherbex.com/delivery/",
    mainEntity: {
      "@type": "Organization",
      name: "Pure Herbex",
      url: "https://pureherbex.com",
      areaServed: {
        "@type": "Country",
        name: "Pakistan",
      },
    },
  };

  return (
    <>
      <JsonLd data={hubSchema} />
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <header className="max-w-4xl mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-bold mb-6">
                <Truck size={16} /> Ships from Okara — All Pakistan
              </div>
              <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
                Delivery in <span className="text-primary">{totalCities}+ Cities</span> Across Pakistan
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Pure Herbex Ultra Force reaches every province — Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan,
                Islamabad, Gilgit-Baltistan, and Azad Kashmir. Rs. 3,000 Cash on Delivery. Discreet packaging. No advance payment.
              </p>
              <a
                href={getWhatsAppOrderLink("Pakistan")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform"
              >
                <MessageCircle size={20} /> Order via WhatsApp
              </a>
              <div className="flex flex-wrap gap-4 mt-6 text-sm">
                <Link href="/ur/delivery/" className="text-primary font-semibold hover:underline" hrefLang="ur">
                  اردو ڈیلیوری صفحہ
                </Link>
                <Link href="/ingredients/" className="text-primary font-semibold hover:underline">
                  32 herbal ingredients
                </Link>
              </div>
            </header>

            <section className="mb-16">
              <h2 className="text-2xl font-heading font-bold mb-4">Browse by province</h2>
              <div className="flex flex-wrap gap-3">
                {PROVINCES.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/delivery/province/${p.slug}/`}
                    className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </section>

            <div className="grid md:grid-cols-3 gap-6 mb-20">
              {[
                { icon: Package, title: "Discreet Packaging", desc: "Plain brown box — zero branding outside" },
                { icon: Shield, title: "Cash on Delivery", desc: "Pay Rs. 3,000 only when parcel arrives" },
                { icon: MapPin, title: "82 Cities", desc: "From Karachi to Gilgit to Mirpur AJK" },
              ].map((item) => (
                <div key={item.title} className="glass-card rounded-2xl p-6">
                  <item.icon className="text-primary mb-4" size={28} />
                  <h2 className="font-bold text-lg mb-2">{item.title}</h2>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            {PROVINCES.map((province) => {
              const cities = getCitiesByProvince(province.slug);
              if (!cities.length) return null;
              return (
                <section key={province.slug} className="mb-16" id={province.slug}>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">{province.name}</h2>
                  <p className="text-muted-foreground mb-6">{cities.length} delivery locations</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {cities.map((city) => (
                      <Link
                        key={city.slug}
                        href={`/delivery/${city.slug}/`}
                        className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm"
                      >
                        <span className="font-medium group-hover:text-primary transition-colors truncate">
                          {city.name}
                        </span>
                        <ChevronRight size={14} className="text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="mb-16">
              <h2 className="text-2xl font-heading font-bold mb-2">Popular neighbourhoods</h2>
              <p className="text-muted-foreground mb-6">DHA, Gulberg, Clifton, Hayatabad & more — {deliveryAreas.length} area pages</p>
              <div className="flex flex-wrap gap-2">
                {deliveryAreas.slice(0, 20).map((area) => (
                  <Link
                    key={area.slug}
                    href={`/delivery/area/${area.slug}/`}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 text-sm"
                  >
                    {area.name}
                  </Link>
                ))}
                <Link href="/delivery/area/lahore-dha/" className="px-4 py-2 text-primary text-sm font-bold">
                  + all areas →
                </Link>
              </div>
            </section>

            <section className="mt-20 p-10 rounded-3xl bg-primary/10 border border-primary/20 text-center">
              <h2 className="text-3xl font-bold mb-4">Don&apos;t see your city?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                We deliver to <strong>all of Pakistan</strong> including villages and tehsils not listed above.
                Message us on WhatsApp with your complete address — if a courier can reach you, we can deliver.
              </p>
              <a
                href={getWhatsAppOrderLink("my area")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold"
              >
                <MessageCircle size={20} /> Ask About Your Area
              </a>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
