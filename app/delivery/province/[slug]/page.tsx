import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PROVINCES, getCitiesByProvince } from "@/lib/delivery-locations";
import { absoluteUrl } from "@/lib/search-config";
import { getWhatsAppOrderLink } from "@/lib/delivery-locations";
import { MessageCircle, ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PROVINCES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const province = PROVINCES.find((p) => p.slug === slug);
  if (!province) return { title: "Not Found" };

  const title = `Pure Herbex Delivery in ${province.name} | COD All Cities`;
  const description = `Order Pure Herbex Ultra Force across ${province.name}, Pakistan. Rs. 3,000 Cash on Delivery, discreet packaging from Okara.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/delivery/province/${slug}/`) },
    openGraph: { title, description, url: absoluteUrl(`/delivery/province/${slug}/`) },
  };
}

export default async function ProvinceDeliveryPage({ params }: Props) {
  const { slug } = await params;
  const province = PROVINCES.find((p) => p.slug === slug);
  if (!province) return null;

  const cities = getCitiesByProvince(slug);
  const schema = {
    "@context": "https://schema.org",
    "@type": "AdministrativeArea",
    name: province.name,
    containedInPlace: { "@type": "Country", name: "Pakistan" },
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-5xl mx-auto">
            <Link href="/delivery/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
              <ChevronLeft size={18} /> All Pakistan delivery
            </Link>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Pure Herbex in {province.name}
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              {cities.length} cities covered · Rs. 3,000 COD · Discreet packaging · Shipped from Okara
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/delivery/${city.slug}/`}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-sm font-medium hover:text-primary transition-all"
                >
                  {city.name}
                </Link>
              ))}
            </div>
            <a href={getWhatsAppOrderLink(province.name)} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold">
              <MessageCircle size={20} /> Order in {province.name}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
