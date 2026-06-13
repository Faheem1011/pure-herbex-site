"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/product/", label: "Shop" },
  { href: "/ingredients/", label: "Ingredients" },
  { href: "/blog/", label: "Blog" },
  { href: "/delivery/", label: "Delivery" },
  { href: "/reviews/", label: "Reviews" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

const WHATSAPP_ORDER_URL =
  "https://wa.me/923160924151?text=Assalam%20o%20Alaikum,%20I%20want%20to%20order%20Pure%20Herbex%20Ultra%20Force%20(Rs.%203,000).";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen, closeMenu]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 safe-top ${
          isScrolled || isMenuOpen
            ? "bg-background/95 backdrop-blur-lg border-b border-border py-3"
            : "bg-transparent py-4 sm:py-6"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center gap-4">
          <Link
            href="/"
            className="relative h-9 w-36 sm:h-10 sm:w-44 shrink-0"
            onClick={closeMenu}
          >
            <Image
              src="/assets/images/typo-herbex.png"
              alt="Pure Herbex Logo"
              fill
              className="object-contain object-left brightness-110"
              priority
            />
          </Link>

          <div className="hidden lg:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={WHATSAPP_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,115,84,0.3)]"
            >
              Order Now
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-11 h-11 -mr-1 rounded-lg text-foreground hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {isMenuOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-black/75 backdrop-blur-sm cursor-default"
          onClick={closeMenu}
          aria-label="Close navigation menu"
          tabIndex={isMenuOpen ? 0 : -1}
        />

        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute top-0 right-0 h-full w-[min(100%,20rem)] bg-background border-l border-border shadow-2xl flex flex-col safe-top safe-bottom transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Menu
            </span>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
              onClick={closeMenu}
              aria-label="Close navigation menu"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href || pathname === link.href.replace(/\/$/, "");
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center min-h-[3rem] px-4 rounded-xl text-base font-medium transition-colors touch-manipulation ${
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-foreground hover:bg-white/5 active:bg-white/10"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            <Link
              href={WHATSAPP_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="flex items-center justify-center w-full min-h-[3rem] px-6 py-3 bg-primary text-primary-foreground rounded-xl text-base font-bold shadow-[0_0_20px_rgba(16,115,84,0.35)] active:scale-[0.98] transition-transform touch-manipulation"
            >
              Order Now via WhatsApp
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Rs. 3,000 · Free COD across Pakistan
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
