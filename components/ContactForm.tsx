"use client";

import { useState } from "react";

import { inboxPublicUrlFromEnv } from "@/lib/inbox-public-url";

const API_BASE = inboxPublicUrlFromEnv();

export default function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setWhatsappUrl(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send message. Try WhatsApp instead.");
      }
      setSuccess(data.message || "Message sent! We will reply on WhatsApp soon.");
      if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
      setName("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h3 className="text-2xl font-bold">Send us a Message</h3>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary space-y-3">
          <p>{success}</p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              Open WhatsApp (optional)
            </a>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="contact-name" className="text-sm font-medium text-muted-foreground">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
            placeholder="Your Name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-phone" className="text-sm font-medium text-muted-foreground">
            Phone Number
          </label>
          <input
            id="contact-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
            placeholder="03XX XXXXXXX"
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <label htmlFor="contact-message" className="text-sm font-medium text-muted-foreground">
            How can we help?
          </label>
          <textarea
            id="contact-message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none h-32"
            placeholder="Tell us what you need..."
          />
        </div>
        {/* Honeypot — hidden from users */}
        <input
          type="text"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(16,115,84,0.3)] disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting ? "Sending to inbox…" : "Submit — reply on WhatsApp"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Goes straight to our WhatsApp inbox — no email needed. We reply from +92 316 0924151.
      </p>
    </form>
  );
}
