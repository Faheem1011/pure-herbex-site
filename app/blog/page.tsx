import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { blogPosts } from './data';
import { Calendar, Clock, ChevronRight, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Wellness Journal | Pure Herbex Ultra Force',
  description: 'Expert insights on male vitality, herbal science, and natural performance. Professional guides from the Pure Herbex research team.',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <header className="max-w-3xl mb-20">
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6">
              Wellness <span className="text-primary">Journal</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transparent, science-backed research on herbal vitality and male performance. 
              Our mission is to provide the knowledge you need for a healthier, more confident life.
            </p>
          </header>

          {/* Featured Post */}
          <div className="mb-20">
            <Link href={`/blog/${blogPosts[3].slug}`} className="group relative block rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500">
              <div className="flex flex-col lg:flex-row min-h-[500px]">
                <div className="lg:w-1/2 p-8 md:p-16 flex flex-col justify-center">
                  <div className="inline-block px-4 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-widest mb-6 w-fit">
                    Featured Guide
                  </div>
                  <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 group-hover:text-primary transition-colors">
                    {blogPosts[3].title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 line-clamp-3">
                    {blogPosts[3].excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
                    <span className="flex items-center gap-2"><Calendar size={16} /> {blogPosts[3].date}</span>
                    <span className="flex items-center gap-2"><Clock size={16} /> {blogPosts[3].readTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    Read Full Guide <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div className="lg:w-1/2 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-12 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                   <div className="relative z-10 text-center">
                      <div className="text-primary/10 text-[200px] font-black absolute inset-0 flex items-center justify-center pointer-events-none">HERB</div>
                      <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white/40">ULTRA FORCE</h3>
                   </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(0, 3).map((post) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group glass-card rounded-[2rem] p-8 hover:border-primary/50 transition-all flex flex-col h-full"
              >
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
                  {post.category}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mb-6 line-clamp-3 flex-grow">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-6 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date.split(',')[0]}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime}</span>
                  </div>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform text-primary" />
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter / CTA */}
          <section className="mt-32 p-12 md:p-20 rounded-[3rem] bg-gradient-to-b from-primary/10 to-transparent border border-white/5 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Stay Informed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join 5,000+ men receiving the latest research on natural wellness and exclusive offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none transition-all"
              />
              <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform">
                Join Now
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
