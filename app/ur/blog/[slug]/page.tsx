import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getUrduPostBySlug, urduBlogPosts } from "@/lib/urdu-blog-data";
import { absoluteUrl } from "@/lib/search-config";
import { ChevronLeft, MessageCircle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return urduBlogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getUrduPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  const languages: Record<string, string> = {
    "ur-PK": absoluteUrl(`/ur/blog/${slug}/`),
  };
  if (post.englishSlug) {
    languages["en-PK"] = absoluteUrl(`/blog/${post.englishSlug}/`);
  }

  return {
    title: `${post.title} | Pure Herbex`,
    description: post.seoDescription,
    keywords: post.seoKeywords.join(", "),
    alternates: { canonical: absoluteUrl(`/ur/blog/${slug}/`), languages },
    openGraph: {
      title: post.title,
      description: post.seoDescription,
      url: absoluteUrl(`/ur/blog/${slug}/`),
      locale: "ur_PK",
      type: "article",
    },
  };
}

const WA =
  "https://wa.me/923160924151?text=Assalam%20o%20Alaikum,%20میں%20Pure%20Herbex%20سالاجیت%20کے%20بارے%20میں%20پوچھنا%20چاہتا%20ہوں۔";

export default async function UrduBlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getUrduPostBySlug(slug);
  if (!post) return null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription,
    inLanguage: "ur-PK",
    datePublished: "2026-06-13",
    author: { "@type": "Organization", name: "Pure Herbex" },
    publisher: {
      "@type": "Organization",
      name: "Pure Herbex",
      logo: { "@type": "ImageObject", url: absoluteUrl("/assets/images/product-bottle.png") },
    },
    mainEntityOfPage: absoluteUrl(`/ur/blog/${slug}/`),
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <div className="min-h-screen bg-background text-foreground" dir="rtl" lang="ur">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto text-right">
            <Link
              href="/ur/blog/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 text-sm"
            >
              <ChevronLeft size={18} className="rotate-180" /> واپس اردو بلاگ
            </Link>

            {post.englishSlug && (
              <Link
                href={`/blog/${post.englishSlug}/`}
                className="block mb-6 text-sm text-primary hover:underline"
                dir="ltr"
              >
                Read in English ←
              </Link>
            )}

            <header className="mb-10 space-y-4">
              <h1 className="text-3xl md:text-4xl font-heading font-bold leading-snug">{post.title}</h1>
              <p className="text-muted-foreground text-sm">{post.date} · {post.readTime}</p>
              <p className="text-lg text-muted-foreground">{post.excerpt}</p>
            </header>

            <article
              className="prose prose-invert prose-emerald max-w-none prose-headings:font-heading prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary text-right"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
              <p className="font-bold text-lg">آرڈر کریں — Rs. 3,000 COD</p>
              <Link
                href={WA}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold"
              >
                <MessageCircle size={20} /> واٹس ایپ آرڈر
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
