"use client";

import { Facebook, Twitter, MessageCircle, Link as LinkIcon, Share2 } from "lucide-react";

type Props = {
  facebook: string;
  twitter: string;
  whatsapp: string;
  url: string;
};

export default function BlogShareBar({ facebook, twitter, whatsapp, url }: Props) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div className="mt-16 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Share Article</span>
        <div className="flex items-center gap-2">
          <a
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
          >
            <Facebook size={18} />
          </a>
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X"
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
          >
            <Twitter size={18} />
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
          >
            <MessageCircle size={18} />
          </a>
          <button
            type="button"
            aria-label="Copy article link"
            onClick={copyLink}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
          >
            <LinkIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Share2 size={16} />
        <span>Share this guide</span>
      </div>
    </div>
  );
}
