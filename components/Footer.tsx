"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Music2 } from 'lucide-react';

export default function Footer() {
  const socials = [
    { name: 'Facebook', icon: <Facebook size={18} />, href: 'https://www.facebook.com/profile.php?id=61589767019589' },
    { name: 'Instagram', icon: <Instagram size={18} />, href: 'https://www.instagram.com/pure.herbex9616053/' },
    { name: 'TikTok', icon: <Music2 size={18} />, href: 'https://www.tiktok.com/@pureherbex8' },
  ];

  return (
    <footer className="bg-black pt-24 pb-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-2 space-y-8">
            <Image 
              src="/assets/images/typo-herbex.png" 
              alt="Pure Herbex Typography" 
              width={400} 
              height={100} 
              className="brightness-125"
            />
            <p className="text-muted-foreground max-w-sm">
              The gold standard in male herbal wellness. Pure ingredients, medical-grade potency, 
              and results that speak for themselves.
            </p>
            <div className="flex gap-4">
              {socials.map((social) => (
                <Link 
                  key={social.name} 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/product" className="hover:text-primary transition-colors">Shop Ultra Force</Link></li>
              <li><Link href="/ingredients" className="hover:text-primary transition-colors">32 Ingredients</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Wellness Journal</Link></li>
              <li><Link href="/delivery" className="hover:text-primary transition-colors">Delivery — All Pakistan</Link></li>
              <li><Link href="/faq/" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/reviews" className="hover:text-primary transition-colors">Customer Reviews</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">Our Story</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">
              <Link href="/delivery" className="hover:text-primary transition-colors">Delivery Areas</Link>
            </h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/delivery/lahore/" className="hover:text-primary transition-colors">Lahore (1–2 Days)</Link></li>
              <li><Link href="/delivery/karachi/" className="hover:text-primary transition-colors">Karachi (2–3 Days)</Link></li>
              <li><Link href="/delivery/islamabad/" className="hover:text-primary transition-colors">Islamabad (1–2 Days)</Link></li>
              <li><Link href="/delivery/peshawar/" className="hover:text-primary transition-colors">Peshawar (2–3 Days)</Link></li>
              <li><Link href="/ur/delivery/" className="hover:text-primary transition-colors">اردو ڈیلیوری</Link></li>
              <li><Link href="/delivery/" className="hover:text-primary transition-colors text-primary font-medium">82 cities nationwide →</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © 2026 Pure Herbex Pakistan. All Rights Reserved. <br className="md:hidden" />
            <Link href="/privacy/" className="hover:text-primary transition-colors ml-0 md:ml-4">Privacy Policy</Link>
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
            <span>✅ 100% Original</span>
            <span>✅ COD Available</span>
            <span>✅ Money Back Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
