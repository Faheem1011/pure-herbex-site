import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, User, ArrowLeft, ArrowRight, Sparkles, Share2, Check, MessageCircle, ExternalLink, Tag } from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '../data/blogs';
import { PRODUCTS } from '../data/products';
import { SEOHead } from './SEOHead';

interface SkincareJournalPageProps {
  selectedArticleId?: string | null;
  onNavigate: (route: string, id?: string) => void;
  onAddToCart: (product: any) => void;
}

export const SkincareJournalPage: React.FC<SkincareJournalPageProps> = ({
  selectedArticleId,
  onNavigate,
  onAddToCart
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const currentPost = BLOG_POSTS.find(p => p.id === selectedArticleId || p.slug === selectedArticleId);

  const handleShareWhatsApp = (post: BlogPost) => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://pureherbex.com/journal/${post.slug}`;
    const text = `🌿 Check out this botanical skincare guide: *${post.title}*\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = (post: BlogPost) => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://pureherbex.com/journal/${post.slug}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categories = ['all', ...Array.from(new Set(BLOG_POSTS.map(p => p.category)))];

  const filteredPosts = selectedCategory === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === selectedCategory);

  // If reading an individual article:
  if (currentPost) {
    const relatedProducts = currentPost.relatedProductIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);

    return (
      <div className="bg-sun-sand min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
        <SEOHead 
          title={currentPost.title}
          description={currentPost.excerpt}
          keywords={currentPost.keywords.join(', ')}
          image={currentPost.image}
          path={`/journal/${currentPost.slug}`}
          type="article"
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'Journal', url: '/journal' },
            { name: currentPost.title, url: `/journal/${currentPost.slug}` }
          ]}
        />

        <article className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Back Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button 
              onClick={() => onNavigate('journal')}
              className="flex items-center gap-2 text-xs font-black uppercase text-sun-dark hover:text-amber-700 bg-sun-cream px-4 py-2.5 rounded-full border-2 border-sun-dark shadow-retro-sm transition-all transform hover:-translate-x-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Articles
            </button>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShareWhatsApp(currentPost)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-full border border-sun-dark shadow-retro-sm flex items-center gap-1.5 transition-all"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={() => handleShareTwitter(currentPost)}
                className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs px-3.5 py-2 rounded-full border border-sun-dark shadow-retro-sm flex items-center gap-1.5 transition-all"
                title="Share on Twitter"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="bg-sun-cream hover:bg-sun-sand text-sun-dark font-black text-xs px-3.5 py-2 rounded-full border border-sun-dark shadow-retro-sm flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Article Banner & Title Card */}
          <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-5 sm:p-10 shadow-retro-lg space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sun-dark/15 pb-4">
              <span className="badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black">
                {currentPost.category}
              </span>
              <div className="flex items-center gap-4 text-xs font-bold text-sun-brown">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {currentPost.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {currentPost.readTime}</span>
              </div>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-sun-dark leading-tight">
              {currentPost.title}
            </h1>

            <div className="flex items-center gap-3 text-xs font-bold text-sun-dark pt-1">
              <div className="w-9 h-9 rounded-full bg-sun-yellow border-2 border-sun-dark flex items-center justify-center font-black shadow-retro-sm">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-black uppercase">{currentPost.author}</span>
                <span className="text-sun-brown font-medium">Certified Botanical Skincare Specialist</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-3 border-sun-dark shadow-retro bg-sun-sand">
              <img 
                src={currentPost.image} 
                alt={currentPost.title} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                }}
                className="w-full max-h-[420px] aspect-video object-cover"
              />
            </div>

            {/* Quick Table of Contents */}
            <div className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2 font-display font-black text-xs sm:text-sm text-sun-dark uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>IN THIS BOTANICAL GUIDE</span>
              </div>
              <ul className="space-y-1 text-xs font-bold text-sun-brown">
                {currentPost.content.sections.map((sec, i) => (
                  <li key={i} className="hover:text-amber-800 transition-colors flex items-center gap-2">
                    <span className="text-sun-dark">•</span>
                    <span>{sec.heading}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Article Intro Callout */}
            <p className="text-sm sm:text-lg font-bold text-sun-dark leading-relaxed border-l-4 border-sun-yellow pl-4 py-2 italic bg-amber-50 rounded-r-xl">
              {currentPost.content.intro}
            </p>

            {/* Main Article Sections */}
            <div className="space-y-8 pt-4">
              {currentPost.content.sections.map((section, idx) => (
                <section key={idx} className="space-y-3">
                  <h2 className="font-display font-black text-xl sm:text-2xl text-sun-dark">
                    {section.heading}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-sun-dark/90 leading-relaxed">
                    {section.body}
                  </p>
                  {section.bulletPoints && (
                    <ul className="bg-sun-sand p-4 sm:p-5 rounded-2xl border-2 border-sun-dark/20 space-y-2.5 text-xs font-bold text-sun-brown">
                      {section.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* Keywords Tag Cloud */}
            <div className="pt-4 border-t border-sun-dark/15 space-y-2">
              <span className="text-[11px] font-black uppercase text-sun-brown flex items-center gap-1">
                <Tag className="w-3 h-3" /> Related Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentPost.keywords.map((kw, i) => (
                  <span key={i} className="text-[11px] font-bold bg-sun-sand text-sun-dark px-2.5 py-1 rounded-full border border-sun-dark/30">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Article Conclusion */}
            <div className="bg-sun-yellow/30 p-5 sm:p-6 rounded-2xl border-2 border-sun-dark text-xs sm:text-sm font-bold text-sun-dark space-y-2">
              <span className="font-black uppercase tracking-wider block text-amber-900">Key Takeaway:</span>
              <p className="leading-relaxed">{currentPost.content.conclusion}</p>
            </div>
          </div>

          {/* Related Products CTA Section */}
          {relatedProducts.length > 0 && (
            <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro-lg space-y-6">
              <h3 className="font-display font-black text-xl sm:text-2xl uppercase text-sun-dark flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-sun-yellow" /> Recommended Botanical Products in Article
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {relatedProducts.map(prod => (
                  <div key={prod!.id} className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-retro-sm">
                    <div>
                      <div className="h-32 w-full bg-sun-cream rounded-xl p-2 mb-2 flex items-center justify-center border border-sun-dark/20">
                        <img 
                          src={prod!.image} 
                          alt={prod!.name} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                          }}
                          className="max-h-full max-w-full object-contain" 
                        />
                      </div>
                      <h4 className="font-display font-black text-sm text-sun-dark line-clamp-1">{prod!.name}</h4>
                      <p className="text-xs font-black text-amber-900 mt-0.5">Rs. {prod!.price.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => onAddToCart(prod)}
                      className="w-full bg-sun-yellow text-sun-dark font-black text-xs py-2.5 rounded-full border-2 border-sun-dark hover:bg-amber-400 uppercase tracking-wider shadow-retro-sm transition-all active:scale-95"
                    >
                      + Add To Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </article>
      </div>
    );
  }

  // Listing View (Index of all blog posts)
  return (
    <div className="bg-sun-sand min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <SEOHead 
        title="Skincare Journal & Botanical Science Guides"
        description="Explore research-backed skincare routines, damask rose water benefits, and artisanal herbal face pack rituals from Pure Herbex."
        path="/journal"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Skincare Journal', url: '/journal' }
        ]}
      />

      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
        
        {/* Header Hero Section */}
        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-12 shadow-retro-lg text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black px-4 py-1.5 rounded-full">
            <BookOpen className="w-4 h-4" /> BOTANICAL SCIENCE & GLOW GUIDES
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-sun-dark">
            Pure Radiance <span className="text-amber-700">Skincare Journal</span>
          </h1>

          <p className="text-xs sm:text-base font-medium text-sun-brown max-w-2xl mx-auto leading-relaxed">
            Dermatological insights, natural ingredient guides, and morning radiance rituals curated by Pure Herbex specialists for healthy, glowing skin across Pakistan.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-black px-4 py-2 rounded-full border-2 border-sun-dark uppercase transition-all ${
                  selectedCategory === cat
                    ? 'bg-sun-yellow text-sun-dark shadow-retro-sm'
                    : 'bg-sun-sand text-sun-dark/80 hover:bg-amber-100'
                }`}
              >
                {cat === 'all' ? 'All Guides' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosts.map(post => (
            <article 
              key={post.id} 
              className="bg-sun-cream border-3 border-sun-dark rounded-3xl p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 group hover:-translate-y-1.5 transition-transform duration-300"
            >
              <div className="space-y-3.5">
                <div className="relative overflow-hidden rounded-2xl border-2 border-sun-dark h-48 bg-sun-sand">
                  <span className="badge-sticker bg-sun-yellow text-sun-dark text-[10px] uppercase absolute top-3 left-3 z-10 font-black">
                    {post.category}
                  </span>
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/glow-kit.png';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-sun-brown">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>

                <h2 className="font-display font-black text-lg sm:text-xl text-sun-dark group-hover:text-amber-700 transition-colors leading-snug">
                  {post.title}
                </h2>

                <p className="text-xs text-sun-dark/80 line-clamp-3 leading-relaxed font-medium">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button 
                  onClick={() => onNavigate('journal', post.slug || post.id)}
                  className="w-full bg-sun-yellow text-sun-dark font-black text-xs py-3 rounded-full border-2 border-sun-dark hover:bg-amber-400 uppercase tracking-wider shadow-retro-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
};
