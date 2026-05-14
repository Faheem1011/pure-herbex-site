import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import Link from 'next/link';

const posts = [
  {
    title: "The Power of Ashwagandha: More Than Just Stress Relief",
    excerpt: "Learn how this ancient herb is the foundation of male stamina and natural performance in Pakistan.",
    date: "May 12, 2026",
    slug: "ashwagandha-stamina-guide"
  },
  {
    title: "Shilajit vs. Modern Supplements: Why Nature Wins",
    excerpt: "A deep dive into why pure mineral pitch is superior to chemical alternatives for longevity.",
    date: "May 10, 2026",
    slug: "shilajit-vs-chemical-supplements"
  },
  {
    title: "Natural Girth Enhancement: Fact or Fiction?",
    excerpt: "We look at the medical science behind herbal vascular expansion and what results you can realistically expect.",
    date: "May 08, 2026",
    slug: "natural-enhancement-science"
  }
];

export default function BlogPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <Navbar />
        
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-20 space-y-4">
              <h1 className="text-5xl lg:text-6xl font-heading font-bold text-glow">The Wellness Journal.</h1>
              <p className="text-xl text-muted-foreground">Expert insights into herbal medicine, male health, and peak performance.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <Link key={index} href={`/blog/${post.slug}`} className="group glass-card p-8 rounded-3xl space-y-6 hover:border-primary/50 transition-all flex flex-col h-full">
                  <div className="text-xs text-primary font-bold tracking-widest uppercase">{post.date}</div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors leading-tight">{post.title}</h3>
                  <p className="text-muted-foreground text-sm flex-grow leading-relaxed">{post.excerpt}</p>
                  <div className="pt-4 flex items-center gap-2 text-sm font-bold group-hover:gap-4 transition-all">
                    Read Article 
                    <span className="text-primary">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </SmoothScroll>
  );
}
