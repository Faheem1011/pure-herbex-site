import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { blogPosts } from '../data';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, User, Clock, ChevronLeft, MessageCircle, Share2, Facebook, Twitter, Link as LinkIcon } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Pure Herbex Wellness Journal`,
    description: post.seoDescription,
    keywords: post.seoKeywords.join(', '),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <Link href="/blog" className="text-primary hover:underline flex items-center gap-2">
          <ChevronLeft size={20} /> Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
            <ChevronLeft size={18} />
            Back to Wellness Journal
          </Link>

          {/* Header */}
          <header className="space-y-6 mb-12">
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-bold tracking-wide uppercase">
              {post.category}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-white/5 py-6">
              <div className="flex items-center gap-2">
                <User size={16} className="text-primary" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article 
            className="prose prose-invert prose-emerald max-w-none 
              prose-headings:font-heading prose-headings:font-bold 
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 
              prose-p:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground
              prose-li:text-muted-foreground prose-li:text-lg
              prose-strong:text-white prose-strong:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Social Sharing */}
          <div className="mt-16 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Share Article</span>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                  <Facebook size={18} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                  <Twitter size={18} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Share2 size={16} />
              <span>1.2k Shares</span>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <section className="mt-20 glass-card p-8 md:p-12 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32 rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_30px_rgba(16,115,84,0.4)]">
                <MessageCircle size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">Have clinical questions?</h3>
                <p className="text-muted-foreground text-lg">Our herbal experts are available on WhatsApp for free consultation and discreet ordering.</p>
              </div>
              <a 
                href={`https://wa.me/923160924151?text=Hello,%20I%20just%20read%20your%20article%20on%20${encodeURIComponent(post.title)}%20and%20wanted%20to%20know%20more.`}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,115,84,0.3)] whitespace-nowrap"
              >
                Chat with Expert
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
