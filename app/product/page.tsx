import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import HeroSection from '@/components/HeroSection';
import IngredientsGrid from '@/components/IngredientsGrid';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Buy Pure Herbex Ultra Force | Stamina & Vitality Formula',
  description: 'Buy Pure Herbex Ultra Force in Pakistan for Rs. 3,000. 100% organic medical-grade formula with Saffron and Ginseng. Free & discreet Cash on Delivery.',
  alternates: {
    canonical: 'https://pureherbex.com/product',
  },
};

export default function ProductPage() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Pure Herbex Ultra Force",
    "image": "https://pureherbex.com/assets/images/product-bottle.png",
    "description": "Pure Herbex Ultra Force is Pakistan's premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health.",
    "sku": "PH-UF-01",
    "mpn": "PH-UF-01",
    "brand": {
      "@type": "Brand",
      "name": "Pure Herbex"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Ahmed Ali"
        },
        "reviewBody": "Mene pehle chemical pills use ki thin jin se bohot headache hota tha. Pure Herbex Ultra Force se results slow aye lekin koi side effect nahi hua. Highly recommended."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Usman Khan"
        },
        "reviewBody": "Discreet packaging was perfect. Product delivery was fast. I have been using it for 3 weeks and the difference in stamina is incredible."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Tariq Mehmood"
        },
        "reviewBody": "Bohot achi jeri bootiyan hain. Office k baad thakawat bilkul khatam ho jati hai. 10/10 product, delivery reached Rawalpindi in 24 hours."
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "9"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://pureherbex.com/product/",
      "priceCurrency": "PKR",
      "price": "3000",
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Pure Herbex"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How to use Pure Herbex Ultra Force?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Take 1 capsule twice daily after meals. For maximum results, take with warm milk and maintain a consistent routine for 30 days."
        }
      },
      {
        "@type": "Question",
        "name": "Is Pure Herbex Ultra Force safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Pure Herbex Ultra Force is formulated with 100% natural, medical-grade herbal ingredients and has absolutely no side effects."
        }
      },
      {
        "@type": "Question",
        "name": "Is delivery discreet and private?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we guarantee 100% discreet packaging in plain, unmarked boxes so nobody knows what is inside. We offer free Cash on Delivery (COD) all over Pakistan."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pureherbex.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Product",
        "item": "https://pureherbex.com/product"
      }
    ]
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <SmoothScroll>
        <main className="min-h-screen">
          <Navbar />
          
          {/* Reusing Hero Section for Product Page with slight tweaks or just keep it as the primary landing */}
          <HeroSection />

          <section className="py-24 border-y border-border">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-10">
                  <h2 className="text-4xl font-heading font-bold">The Science of Ultra Force</h2>
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">1</div>
                      <div>
                        <h4 className="font-bold mb-2">Phase 1: Deep Absorption (Week 1)</h4>
                        <p className="text-sm text-muted-foreground">The 32 herbal extracts begin to accumulate in your system, reducing cortisol levels and preparing the body for enhanced blood flow.</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">2</div>
                      <div>
                        <h4 className="font-bold mb-2">Phase 2: Vascular Expansion (Week 2-3)</h4>
                        <p className="text-sm text-muted-foreground">Ingredients like Saffron and Gensing optimize nitric oxide production, leading to noticeable improvements in girth and stamina.</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">3</div>
                      <div>
                        <h4 className="font-bold mb-2">Phase 3: Peak Performance (Week 4+)</h4>
                        <p className="text-sm text-muted-foreground">Hormonal balance is stabilized. You experience explosive vitality and the full benefit of genital enhancement.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-10 rounded-3xl space-y-8 sticky top-32">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">Pure Herbex Ultra Force</h3>
                    <span className="text-primary font-bold text-xl">Rs. 3,000</span>
                  </div>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>✅ 60 Concentrated Capsules (1 Month Supply)</p>
                    <p>✅ 100% Herbal & Medical Grade</p>
                    <p>✅ Discreet Packaging Guaranteed</p>
                    <p>✅ Free Delivery (Lahore, Karachi, Islamabad, etc.)</p>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-border">
                    <p className="text-xs font-bold text-foreground">HOW TO USE:</p>
                    <p className="text-sm">Take 1 capsule twice daily after meals. For maximum results, take with warm milk and maintain a consistent routine for 30 days.</p>
                  </div>
                  <a 
                    href="https://wa.me/923160924151?text=Assalam%20o%20Alaikum,%20I%20want%20to%20order%20Pure%20Herbex%20Ultra%20Force%20(Rs.%203,000)."
                    className="block w-full text-center py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-xl hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(16,115,84,0.3)]"
                  >
                    Order via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>

          <IngredientsGrid />

          <Footer />
        </main>
      </SmoothScroll>
    </>
  );
}
