import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { deliveryCities, PROVINCES, getCitiesByProvince } from "@/lib/delivery-locations";
import { getWhatsAppOrderLink } from "@/lib/delivery-locations";
import { absoluteUrl } from "@/lib/search-config";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "پور ہربیکس ڈیلیوری — پورے پاکستان میں COD",
  description: "پور ہربیکس الٹرا فورس پاکستان بھر 82+ شہروں میں۔ Rs. 3,000 کیش آن ڈیلیوری، خفیہ پیکنگ۔",
  alternates: {
    canonical: absoluteUrl("/ur/delivery/"),
    languages: { "en-PK": absoluteUrl("/delivery/"), "ur-PK": absoluteUrl("/ur/delivery/") },
  },
};

export default function UrduDeliveryHubPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl" lang="ur">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-right">
          <Link href="/delivery/" className="text-primary text-sm mb-6 inline-block" lang="en" dir="ltr">
            English delivery page ←
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            پور ہربیکس — <span className="text-primary">{deliveryCities.length}+ شہروں</span> میں ڈیلیوری
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            پنجاب، سندھ، خیبر پختونخوا، بلوچستان، اسلام آباد، گلگت بلتستان، اور آزاد کشمیر — Rs. 3,000 کیش آن ڈیلیوری۔
          </p>
          <a href={getWhatsAppOrderLink("Pakistan")} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold mb-16">
            <MessageCircle size={20} /> واٹس ایپ آرڈر
          </a>
          {PROVINCES.map((province) => {
            const cities = getCitiesByProvince(province.slug);
            return (
              <section key={province.slug} className="mb-12">
                <h2 className="text-2xl font-bold mb-4">{province.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {cities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/ur/delivery/${city.slug}/`}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-sm font-medium hover:text-primary"
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
