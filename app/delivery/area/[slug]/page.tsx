import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { deliveryAreas, getAreaBySlug } from "@/lib/delivery-areas";
import { getCityBySlug, getWhatsAppOrderLink } from "@/lib/delivery-locations";
import { absoluteUrl } from "@/lib/search-config";
import { MessageCircle, ChevronLeft, MapPin, Clock } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return deliveryAreas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return { title: "Area Not Found" };

  const title = `Pure Herbex ${area.name} Delivery | COD Rs. 3000`;
  const description = `Order herbal stamina capsules in ${area.name}, ${area.cityName}. Cash on Delivery, discreet box, ${area.deliveryDays}.`;

  return {
    title,
    description,
    keywords: area.seoKeywords.join(", "),
    alternates: { canonical: absoluteUrl(`/delivery/area/${slug}/`) },
  };
}

export default async function DeliveryAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return null;

  const city = getCityBySlug(area.citySlug);
  const waLink = getWhatsAppOrderLink(`${area.name}, ${area.cityName}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Pure Herbex Delivery — ${area.name}`,
    areaServed: area.name,
    provider: { "@type": "Organization", name: "Pure Herbex", url: absoluteUrl("/") },
    offers: { "@type": "Offer", price: "3000", priceCurrency: "PKR" },
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <Link href={`/delivery/${area.citySlug}/`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
              <ChevronLeft size={18} /> {area.cityName} delivery
            </Link>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                <MapPin size={14} /> {area.name}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-xs text-muted-foreground">
                <Clock size={14} /> {area.deliveryDays}
              </span>
            </div>
            <h1 className="text-4xl font-heading font-bold mb-6">
              Pure Herbex Delivery in {area.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6" dir="rtl">
              {area.urduName} — {area.cityName}، {area.province}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Order <strong>Pure Herbex Ultra Force</strong> for delivery to <strong>{area.name}</strong> in {area.cityName}.
              Our 32-herb medical-grade formula ships from Okara in plain, discreet packaging. Pay Rs. 3,000 cash when your parcel arrives — no advance payment.
            </p>
            <p className="text-muted-foreground mb-8">
              Typical delivery to {area.name}: <strong>{area.deliveryDays}</strong>. Message WhatsApp with your exact address in {area.name} for fastest dispatch.
            </p>
            <a href={waLink} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold mb-10">
              <MessageCircle size={20} /> Order — {area.name}
            </a>
            {city && (
              <p className="text-sm text-muted-foreground">
                See all of <Link href={`/delivery/${city.slug}/`} className="text-primary hover:underline">{city.name}</Link> ·{" "}
                <Link href="/delivery/" className="text-primary hover:underline">All cities</Link> ·{" "}
                <Link href="/product/" className="text-primary hover:underline">Product</Link>
              </p>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
