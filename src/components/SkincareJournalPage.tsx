import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, User, ArrowLeft, ArrowRight, Sparkles, Share2 } from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '../data/blogs';
import { PRODUCTS } from '../data/products';

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
  const currentPost = BLOG_POSTS.find(p => p.id === selectedArticleId || p.slug === selectedArticleId);

  // If reading an individual article:
  if (currentPost) {
    const relatedProducts = currentPost.relatedProductIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);

    return (
      <div className="bg-sun-sand min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto space-y-8">
          
          {/* Back Button */}
          <button 
            onClick={() => onNavigate('journal')}
            className="flex items-center gap-2 text-xs font-black uppercase text-sun-dark hover:text-amber-700 bg-sun-cream px-4 py-2 rounded-full border-2 border-sun-dark shadow-retro-sm transition-all transform hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Journal Index
          </button>

          {/* Article Banner & Title */}
          <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-10 shadow-retro-lg space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sun-dark/15 pb-4">
              <span className="badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase">
                {currentPost.category}
              </span>
              <div className="flex items-center gap-4 text-xs font-bold text-sun-brown">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {currentPost.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {currentPost.readTime}</span>
              </div>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-sun-dark leading-tight">
              {currentPost.title}
            </h1>

            <div className="flex items-center gap-3 text-xs font-bold text-sun-dark pt-2">
              <div className="w-8 h-8 rounded-full bg-sun-yellow border-2 border-sun-dark flex items-center justify-center font-black">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-black uppercase">{currentPost.author}</span>
                <span className="text-sun-brown font-medium">Certified Botanical Specialist</span>
              </div>
            </div>

            <img 
              src={currentPost.image} 
              alt={currentPost.title} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608248597263-00079e96576d?q=80&w=1000&auto=format&fit=crop';
              }}
              className="w-full max-h-[400px] aspect-video object-cover rounded-2xl border-3 border-sun-dark shadow-retro"
            />

            {/* Article Intro */}
            <p className="text-base sm:text-lg font-bold text-sun-dark leading-relaxed border-l-4 border-sun-yellow pl-4 py-1 italic bg-amber-50 rounded-r-xl">
              {currentPost.content.intro}
            </p>

            {/* Main Article Sections */}
            <div className="space-y-8 pt-4">
              {currentPost.content.sections.map((section, idx) => (
                <section key={idx} className="space-y-3">
                  <h2 className="font-display font-black text-2xl text-sun-dark">
                    {section.heading}
                  </h2>
                  <p className="text-sm font-medium text-sun-dark/90 leading-relaxed">
                    {section.body}
                  </p>
                  {section.bulletPoints && (
                    <ul className="bg-sun-sand p-4 rounded-2xl border-2 border-sun-dark/20 space-y-2 text-xs font-bold text-sun-brown">
                      {section.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-sun-yellow shrink-0" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* Article Conclusion */}
            <div className="bg-sun-yellow/30 p-6 rounded-2xl border-2 border-sun-dark text-sm font-bold text-sun-dark space-y-2">
              <span className="font-black uppercase tracking-wider block text-amber-900">Summary Takeaway:</span>
              <p className="leading-relaxed">{currentPost.content.conclusion}</p>
            </div>
          </div>

          {/* Related Products CTA Section */}
          {relatedProducts.length > 0 && (
            <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-8 shadow-retro-lg space-y-6">
              <h3 className="font-display font-black text-2xl uppercase text-sun-dark flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-sun-yellow" /> Recommended Botanical Products in Article
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedProducts.map(prod => (
                  <div key={prod!.id} className="bg-sun-sand border-2 border-sun-dark rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <img 
                        src={prod!.image} 
                        alt={prod!.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608248597263-00079e96576d?q=80&w=1000&auto=format&fit=crop';
                        }}
                        className="h-32 w-full object-cover rounded-xl mb-2" 
                      />
                      <h4 className="font-display font-black text-sm text-sun-dark line-clamp-1">{prod!.name}</h4>
                      <p className="text-xs font-bold text-sun-brown mt-0.5">Rs. {prod!.price.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => onAddToCart(prod)}
                      className="w-full bg-sun-yellow text-sun-dark font-black text-xs py-2 rounded-full border border-sun-dark hover:bg-amber-400 uppercase tracking-wider shadow-retro-sm"
                    >
                      Add To Cart
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
    <div className="bg-sun-sand min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Hero Section */}
        <div className="bg-sun-cream border-4 border-sun-dark rounded-3xl p-8 sm:p-12 shadow-retro-lg text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase font-black px-4 py-1.5 rounded-full">
            <BookOpen className="w-4 h-4" /> BOTANICAL SCIENCE & GLOW GUIDES
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-sun-dark">
            Pure Radiance <span className="text-amber-700">Skincare Journal</span>
          </h1>

          <p className="text-base sm:text-lg font-medium text-sun-brown max-w-3xl mx-auto leading-relaxed">
            Dermatological insights, natural ingredient guides, and morning radiance rituals curated by Pure Herbex specialists.
          </p>
        </div>

        {/* Articles List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map(post => (
            <article key={post.id} className="bg-sun-cream border-3 border-sun-dark rounded-3xl p-6 shadow-retro flex flex-col justify-between space-y-6 group hover:-translate-y-1.5 transition-transform duration-300">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border-2 border-sun-dark/20 h-48 bg-sun-sand">
                  <span className="badge-sticker bg-sun-yellow text-sun-dark text-xs uppercase absolute top-3 left-3 z-10 font-black">
                    {post.category}
                  </span>
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608248597263-00079e96576d?q=80&w=1000&auto=format&fit=crop';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-sun-brown">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>

                <h2 className="font-display font-black text-xl text-sun-dark group-hover:text-amber-700 transition-colors leading-tight">
                  {post.title}
                </h2>

                <p className="text-xs text-sun-dark/80 line-clamp-3 leading-relaxed font-medium">
                  {post.excerpt}
                </p>
              </div>

              <button 
                onClick={() => onNavigate('journal', post.id)}
                className="w-full bg-sun-yellow text-sun-dark font-black text-xs py-3 rounded-full border-2 border-sun-dark hover:bg-amber-400 uppercase tracking-wider shadow-retro-sm flex items-center justify-center gap-2"
              >
                Read Article <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
};
