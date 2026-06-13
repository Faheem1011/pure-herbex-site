import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { siteFaqs } from "@/lib/faq-data";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ | Pure Herbex Ultra Force Pakistan",
  description:
    "Frequently asked questions about Pure Herbex Ultra Force — price, COD delivery, dosage, side effects, discreet packaging, and delivery to all Pakistan cities.",
  alternates: { canonical: "https://pureherbex.com/faq/" },
  openGraph: {
    title: "Pure Herbex FAQ",
    description: "Answers about ordering, delivery, dosage, and herbal stamina in Pakistan.",
    url: "https://pureherbex.com/faq/",
    siteName: "Pure Herbex",
    type: "website",
  },
};

const WHATSAPP =
  "https://wa.me/923160924151?text=Assalam%20o%20Alaikum,%20I%20have%20a%20question%20about%20Pure%20Herbex%20Ultra%20Force.";

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <header className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                Frequently Asked <span className="text-primary">Questions</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Everything about ordering, delivery, dosage, and results — Pure Herbex Pakistan.
              </p>
            </header>

            <div className="space-y-4">
              {siteFaqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-white/10 bg-white/5 open:border-primary/30 transition-colors"
                >
                  <summary className="cursor-pointer list-none px-6 py-5 font-semibold text-lg flex justify-between items-center gap-4">
                    {item.question}
                    <span className="text-primary text-2xl group-open:rotate-45 transition-transform shrink-0">+</span>
                  </summary>
                  <div className="px-6 pb-5 text-muted-foreground leading-relaxed border-t border-white/5 pt-4">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
              <h2 className="text-2xl font-heading font-bold">Still have a question?</h2>
              <p className="text-muted-foreground">Message us on WhatsApp — we reply within hours.</p>
              <Link
                href={WHATSAPP}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform"
              >
                <MessageCircle size={20} /> WhatsApp Support
              </Link>
              <p className="text-sm text-muted-foreground">
                Or explore{" "}
                <Link href="/delivery/" className="text-primary hover:underline">delivery cities</Link>
                {" · "}
                <Link href="/ingredients/" className="text-primary hover:underline">32 ingredients</Link>
                {" · "}
                <Link href="/blog/" className="text-primary hover:underline">wellness journal</Link>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
