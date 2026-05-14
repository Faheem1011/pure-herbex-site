"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-lg border-b border-border py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="relative h-10 w-48">
          <Image 
            src="/assets/images/typo-herbex.png" 
            alt="Pure Herbex Logo" 
            fill
            className="object-contain brightness-110"
            priority
          />
        </Link>

        <div className="hidden lg:flex gap-8 items-center">
          <Link href="/product" className="text-sm font-medium hover:text-primary transition-colors">Shop</Link>
          <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
          <Link href="/reviews" className="text-sm font-medium hover:text-primary transition-colors">Reviews</Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</Link>
          <Link 
            href="https://wa.me/923001234567"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,115,84,0.3)]"
          >
            Order Now
          </Link>
        </div>

        <button className="lg:hidden text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>
    </nav>
  );
}
