import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { urduBlogPosts } from "@/lib/urdu-blog-data";
import { absoluteUrl } from "@/lib/search-config";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "اردو بلاگ | Pure Herbex — سالاجیت اور مردانہ صحت",
  description:
    "اردو میں ہربل صحت، سالاجیت، توانائی اور قدرتی کارکردگی پر مضامین۔ Pure Herbex Pakistan۔",
  alternates: {
    canonical: absoluteUrl("/ur/blog/"),
    languages: { "ur-PK": absoluteUrl("/ur/blog/"), "en-PK": absoluteUrl("/blog/") },
  },
};

export default function UrduBlogHubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl" lang="ur">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12 text-right">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Pure Herbex <span className="text-primary">اردو بلاگ</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              سالاجیت، ہربل توانائی، اور مردانہ صحت — سادہ اردو میں سائنسی معلومات۔
            </p>
            <Link href="/blog/" className="inline-block mt-4 text-sm text-primary hover:underline" dir="ltr">
              English Wellness Journal ←
            </Link>
          </header>

          <div className="space-y-6">
            {urduBlogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/ur/blog/${post.slug}/`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/40 transition-colors text-right"
              >
                <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                <p className="text-muted-foreground text-sm mb-3">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                  مضمون پڑھیں <ChevronRight size={16} className="rotate-180" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
