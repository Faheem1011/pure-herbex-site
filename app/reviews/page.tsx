import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import FacebookReviewWall from '@/components/FacebookReviewWall';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Customer Reviews | Pure Herbex Ultra Force Pakistan',
  description:
    'Real Pure Herbex reviews from Lahore, Karachi, Islamabad and across Pakistan. 4.9★ rating — discreet COD delivery, herbal stamina results.',
  alternates: { canonical: 'https://pureherbex.com/reviews/' },
  openGraph: {
    title: 'Pure Herbex Customer Reviews',
    description: 'Verified customer feedback on herbal stamina and discreet delivery in Pakistan.',
    url: 'https://pureherbex.com/reviews/',
  },
};

export default function ReviewsPage() {
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Pure Herbex Ultra Force',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
    },
  };

  return (
    <SmoothScroll>
      <JsonLd data={reviewSchema} />
      <main className="min-h-screen bg-background">
        <Navbar />

        <section className="pt-28 sm:pt-32 pb-8">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-glow mb-4">Customer Reviews</h1>
            <p className="text-lg text-muted-foreground">
              What men across Pakistan say about Pure Herbex Ultra Force — stamina, discreet COD, real herbal results.
            </p>
          </div>
        </section>

        <FacebookReviewWall />

        <section className="py-16 px-6 bg-background">
          <div className="glass-card p-8 sm:p-12 rounded-3xl max-w-2xl mx-auto text-center space-y-6 bg-primary/5 border-primary/20">
            <h2 className="text-2xl font-bold">Share Your Experience</h2>
            <p className="text-muted-foreground">
              Used Pure Herbex? Send feedback on WhatsApp — we feature real customer stories.
            </p>
            <a
              href="https://wa.me/923160924151?text=Assalam%20o%20Alaikum,%20I%20want%20to%20give%20feedback%20on%20Pure%20Herbex%20Ultra%20Force."
              className="inline-block px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Submit Feedback on WhatsApp
            </a>
          </div>
        </section>

        <Footer />
      </main>
    </SmoothScroll>
  );
}
