import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import Script from 'next/script';
import JsonLd from '@/components/JsonLd';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mushtaq.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Mushtaq Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
  description: 'Mushtaq Ultra Force is Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health. 100% Herbal. Rs. 3,000. Cash on Delivery Available.',
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'r6EENSmrJ6_2NeYVkKtE2i-1pIu5qn6KxNegT-ws5OU',
  },
  openGraph: {
    title: 'Mushtaq Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
    description: 'Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health. 100% Herbal. Rs. 3,000. Cash on Delivery Available.',
    url: SITE_URL,
    siteName: 'Mushtaq',
    images: [
      {
        url: '/assets/images/product-bottle.png',
        width: 800,
        height: 600,
        alt: 'Mushtaq Ultra Force',
      },
    ],
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mushtaq Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
    description: 'Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health.',
    images: ['/assets/images/product-bottle.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const globalSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Mushtaq",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/assets/images/product-bottle.png`,
          "caption": "Mushtaq Logo"
        },
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61589767019589",
          "https://www.instagram.com/pure.herbex9616053/",
          "https://www.tiktok.com/@pureherbex8"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+923160924151",
          "contactType": "customer service",
          "areaServed": "PK",
          "availableLanguage": ["English", "Urdu"]
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Okara",
          "addressRegion": "Punjab",
          "addressCountry": "PK"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": "Mushtaq",
        "description": "Pakistan's premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health.",
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        }
      }
    ]
  };

  return (
    <html lang="en-PK" className={`${inter.variable} ${sora.variable} scroll-smooth`}>
      <head>
        <JsonLd data={globalSchema} />
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MV6QT5V3');
          `}
        </Script>
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MV6QT5V3"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Google Analytics Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SRYQF0G350"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-SRYQF0G350');
          `}
        </Script>
        {/* Microsoft Clarity Tag */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wsyc5zjml5");
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}

