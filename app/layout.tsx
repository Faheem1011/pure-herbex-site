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

export const metadata: Metadata = {
  metadataBase: new URL('https://pureherbex.com'),
  title: 'Pure Herbex Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
  description: 'Pure Herbex Ultra Force is Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health. 100% Herbal. Rs. 3,000. Cash on Delivery Available.',
  alternates: {
    canonical: 'https://pureherbex.com',
  },
  verification: {
    google: 'r6EENSmrJ6_2NeYVkKtE2i-1pIu5qn6KxNegT-ws5OU',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Pure Herbex Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
    description: 'Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health. 100% Herbal. Rs. 3,000. Cash on Delivery Available.',
    url: 'https://pureherbex.com',
    siteName: 'Pure Herbex',
    images: [
      {
        url: '/assets/images/product-bottle.png',
        width: 800,
        height: 600,
        alt: 'Pure Herbex Ultra Force',
      },
    ],
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pure Herbex Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
    description: 'Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health.',
    images: ['/assets/images/product-bottle.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const globalSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://pureherbex.com/#organization",
        "name": "Pure Herbex",
        "url": "https://pureherbex.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://pureherbex.com/assets/images/product-bottle.png",
          "caption": "Pure Herbex Logo"
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
        "@id": "https://pureherbex.com/#website",
        "url": "https://pureherbex.com",
        "name": "Pure Herbex",
        "description": "Pakistan's premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health.",
        "publisher": {
          "@id": "https://pureherbex.com/#organization"
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

