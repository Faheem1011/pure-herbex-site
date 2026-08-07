import React, { useEffect } from 'react';
import { Product } from '../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'product' | 'article';
  product?: Product;
  breadcrumbs?: Array<{ name: string; url: string }>;
  isHome?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  path = '',
  type = 'website',
  product,
  breadcrumbs,
  isHome = false,
}) => {
  const siteName = 'Koveria Glow by Pure Herbex';
  const defaultTitle = 'Koveria Glow by Pure Herbex | Premium Botanical Skincare & Sun Radiance';
  const defaultDescription = 'Discover Koveria Glow by Pure Herbex. Pure artisanal botanical skincare, organic face pack powders, soothing aloe toners, and steam-distilled rose water. Handcrafted for natural radiance.';
  const defaultKeywords = 'Pure Herbex, Koveria Glow, botanical skincare, organic face pack, rose water, aloe vera toner, natural glow, herbal mask, sun radiance elixir, artisanal skincare Pakistan';
  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://pureherbex.com';
  const defaultImage = `${domain}/images/glow-kit.png`;

  const metaTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const metaDescription = description || (product ? product.description : defaultDescription);
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image ? (image.startsWith('http') ? image : `${domain}${image}`) : defaultImage;
  const canonicalUrl = `${domain}${path.startsWith('/') ? path : `/${path}`}`;

  useEffect(() => {
    // Update Document Title
    document.title = metaTitle;

    // Helper to create or update meta elements
    const setMetaTag = (nameAttr: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper for link tags
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Meta Description & Keywords
    setMetaTag('name', 'description', metaDescription);
    setMetaTag('name', 'keywords', metaKeywords);
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('name', 'author', 'Pure Herbex');

    // Canonical URL
    setLinkTag('canonical', canonicalUrl);

    // Open Graph (Facebook, WhatsApp, LinkedIn)
    setMetaTag('property', 'og:site_name', siteName);
    setMetaTag('property', 'og:title', metaTitle);
    setMetaTag('property', 'og:description', metaDescription);
    setMetaTag('property', 'og:image', metaImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:locale', 'en_US');

    if (product) {
      setMetaTag('property', 'product:price:amount', product.price.toString());
      setMetaTag('property', 'product:price:currency', 'PKR');
      setMetaTag('property', 'product:availability', product.inStock ? 'in stock' : 'out of stock');
    }

    // Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', metaTitle);
    setMetaTag('name', 'twitter:description', metaDescription);
    setMetaTag('name', 'twitter:image', metaImage);

    // JSON-LD Structured Data Injection
    const jsonLdScripts: HTMLScriptElement[] = [];

    const addJsonLd = (id: string, data: object) => {
      let script = document.getElementById(id) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
      jsonLdScripts.push(script);
    };

    // 1. Organization & Website Schema
    addJsonLd('jsonld-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Pure Herbex',
      brand: 'Koveria Glow',
      url: domain,
      logo: `${domain}/images/brand_logo.png`,
      description: defaultDescription,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['English', 'Urdu']
      }
    });

    addJsonLd('jsonld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: domain,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${domain}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });

    // 2. Product Schema (if viewing a product)
    if (product) {
      addJsonLd('jsonld-product', {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: [metaImage],
        description: product.description,
        sku: product.id,
        brand: {
          '@type': 'Brand',
          name: 'Koveria Glow by Pure Herbex'
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'PKR',
          price: product.price,
          priceValidUntil: '2030-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Pure Herbex'
          }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating || 5.0,
          reviewCount: product.reviewCount || 100,
          bestRating: '5',
          worstRating: '1'
        }
      });
    } else {
      // Remove product schema if not on a product page
      const existingProductJsonLd = document.getElementById('jsonld-product');
      if (existingProductJsonLd) existingProductJsonLd.remove();
    }

    // 3. Breadcrumb Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      addJsonLd('jsonld-breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: b.name,
          item: b.url.startsWith('http') ? b.url : `${domain}${b.url}`
        }))
      });
    }

    // 4. FAQ Schema (for homepage / brand story)
    if (isHome) {
      addJsonLd('jsonld-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Are Pure Herbex Koveria Glow products 100% natural and organic?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! All Koveria Glow products are artisanal, handcrafted in small batches using pure rose petals, moringa, organic aloe vera, and steam-distilled hydrosols without harsh synthetic chemicals or artificial parabens.'
            }
          },
          {
            '@type': 'Question',
            name: 'How soon can I see skincare results with Koveria Glow?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Most customers notice baby-soft skin, instant hydration, and a healthy sun-drenched glow after their very first 15-minute face pack and rose water ritual.'
            }
          },
          {
            '@type': 'Question',
            name: 'Do you offer Cash on Delivery (COD) across Pakistan?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, we provide fast nationwide Cash on Delivery shipping across Pakistan via Leopards Courier with real-time order tracking.'
            }
          }
        ]
      });
    }

  }, [metaTitle, metaDescription, metaKeywords, metaImage, canonicalUrl, type, product, breadcrumbs, isHome]);

  return null;
};
