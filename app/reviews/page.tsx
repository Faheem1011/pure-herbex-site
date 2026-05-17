import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    name: "Ahmed Ali",
    city: "Lahore",
    date: "April 18, 2026",
    text: "Mene pehle chemical pills use ki thin jin se bohot headache hota tha. Pure Herbex Ultra Force se results slow aye lekin koi side effect nahi hua. Highly recommended for long term results.",
    rating: 5
  },
  {
    name: "Usman Khan",
    city: "Karachi",
    date: "May 02, 2026",
    text: "Discreet packaging was perfect. Product delivery was fast. I have been using it for 3 weeks and the difference in stamina is incredible.",
    rating: 5
  },
  {
    name: "Dr. Farooq",
    city: "Islamabad",
    date: "March 29, 2026",
    text: "As a wellness consultant, I analyzed the ingredients. The inclusion of Musli Sufaid and Saffron at these concentrations is rare. It's a solid medical-grade herbal formula.",
    rating: 4
  },
  {
    name: "Zahid",
    city: "Faisalabad",
    date: "April 24, 2026",
    text: "Result milne me 10-12 din lage, par ab energy level bohot high hai. Order process was easy on WhatsApp.",
    rating: 5
  },
  {
    name: "Tariq Mehmood",
    city: "Rawalpindi",
    date: "May 10, 2026",
    text: "Bohot achi jeri bootiyan hain. Office k baad thakawat bilkul khatam ho jati hai. 10/10 product, delivery reached Rawalpindi in 24 hours.",
    rating: 5
  },
  {
    name: "Kamran Shah",
    city: "Peshawar",
    date: "May 12, 2026",
    text: "I was skeptical at first, but their customer support on WhatsApp explained everything. Discreet shipping was key for me. Highly recommended.",
    rating: 5
  },
  {
    name: "Bilal Butt",
    city: "Gujranwala",
    date: "April 30, 2026",
    text: "Best natural stamina booster. No heart pressure or blood pressure issue. Real organic herbals that actually show physical improvement.",
    rating: 5
  },
  {
    name: "Sajid Jamil",
    city: "Multan",
    date: "May 06, 2026",
    text: "Delivery reached Multan in 2 days. The parcel was wrapped in a simple white box with no mention of sex wellness. Fully satisfied with the privacy.",
    rating: 5
  },
  {
    name: "Dr. Adnan",
    city: "Quetta",
    date: "May 01, 2026",
    text: "Clinical dosage of Saffron and Shilajit works wonders for physical exhaustion. Highly recommended adaptogen for active men over 35.",
    rating: 5
  }
];

export default function ReviewsPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <Navbar />
        
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-20 space-y-4">
              <h1 className="text-5xl lg:text-6xl font-heading font-bold text-glow">Customer Stories.</h1>
              <p className="text-xl text-muted-foreground">Authentic feedback from our community across Pakistan.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {reviews.map((review, index) => (
                <div key={index} className="glass-card p-10 rounded-3xl relative">
                  <div className="absolute top-8 right-8 text-primary/20">
                    <Quote size={40} />
                  </div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-lg mb-8 italic text-foreground/90">&quot;{review.text}&quot;</p>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-white">
                        {review.name}
                        <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold">✓</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{review.city}, Pakistan</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Verified Order</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{review.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 glass-card p-12 rounded-3xl max-w-2xl mx-auto text-center space-y-6 bg-primary/5 border-primary/20">
              <h3 className="text-2xl font-bold">Share Your Experience</h3>
              <p className="text-muted-foreground">Help others make an informed decision. Send us your feedback on WhatsApp and get a 10% discount on your next order.</p>
              <a href="https://wa.me/923160924151?text=Assalam%20o%20Alaikum,%20I%20want%20to%20give%20feedback%20on%20Pure%20Herbex..." className="inline-block px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform">
                Submit Feedback
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </SmoothScroll>
  );
}

