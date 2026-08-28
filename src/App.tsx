import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BuildYourBundle } from './components/BuildYourBundle';
import { ProductGrid } from './components/ProductGrid';
import { BrandStory } from './components/BrandStory';
import { RoutineFinder } from './components/RoutineFinder';
import { ReviewsSection } from './components/ReviewsSection';
import { CartDrawer } from './components/CartDrawer';
import { TrackOrderModal } from './components/TrackOrderModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { QuickViewModal } from './components/QuickViewModal';
import { AdminPortal } from './components/AdminPortal';
import { ProductDetail } from './components/ProductDetail';
import { PoliciesPage } from './components/PoliciesPage';
import { Footer } from './components/Footer';
import { MascotWidget } from './components/MascotWidget';
import { SEOHead } from './components/SEOHead';
import { BotanicalGlossaryPage } from './components/BotanicalGlossaryPage';
import { SkincareJournalPage } from './components/SkincareJournalPage';
import { FAQPage } from './components/FAQPage';
import { ContactPage } from './components/ContactPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { CreatorPortal } from './components/CreatorPortal';

import { PRODUCTS as DEFAULT_PRODUCTS } from './data/products';
import { Product, CartItem } from './types';
import { fetchLiveProducts } from './services/supabase';
import { saveActivePromoCode, validatePromoCode } from './services/creatorService';

export function App() {
  // Routing State synced with window.location
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\//, '');
    return path || 'home';
  });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/^\/product\/(.+)$/);
    return match ? match[1] : null;
  });

  // Promo Notification Banner
  const [promoBanner, setPromoBanner] = useState<string | null>(null);

  // Dynamic Products List loaded from Database / Cache
  const [productsList, setProductsList] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('pureherbex_products_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_PRODUCTS.length && parsed.every((p: any) => DEFAULT_PRODUCTS.some(dp => dp.id === p.id && dp.price === p.price))) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_PRODUCTS;
  });
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart & UI Dialog States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [trackInitialCode, setTrackInitialCode] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Fetch live products from database / Supabase Cloud
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const prods = await fetchLiveProducts();
      if (prods && prods.length > 0) {
        setProductsList(prods);
      }
    } catch (err) {
      console.warn('Could not load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();

    // Check for Creator Promo in URL (e.g. ?promo=AYESHA10 or ?ref=SARA10)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPromo = urlParams.get('promo') || urlParams.get('ref') || urlParams.get('code');
      if (urlPromo) {
        const val = validatePromoCode(urlPromo);
        if (val.isValid && val.code) {
          saveActivePromoCode(val.code);
          setPromoBanner(`🎉 Creator Promo "${val.code}" Activated: 10% OFF at Checkout!`);
          setTimeout(() => setPromoBanner(null), 8000);
        }
      }
    } catch (e) {}
  }, []);

  // Sync route changes with browser address bar & history
  const navigateTo = (route: string, itemId?: string) => {
    let path = '/';
    if (route === 'admin') path = '/admin';
    else if (route === 'creators' || route === 'creator' || route === 'affiliate') path = '/creators';
    else if (route === 'shop') path = '/shop';
    else if (route === 'story') path = '/story';
    else if (route === 'policies') path = '/policies';
    else if (route === 'ingredients') path = '/ingredients';
    else if (route === 'journal') path = itemId ? `/journal/${itemId}` : '/journal';
    else if (route === 'faq') path = '/faq';
    else if (route === 'contact') path = '/contact';
    else if (route === 'track-order') path = '/track-order';
    else if (route === 'routine-finder') path = '/routine-finder';
    else if (route === 'product' && itemId) path = `/product/${itemId}`;

    window.history.pushState({}, '', path);
    setCurrentRoute(route);
    if (route === 'product' && itemId) {
      setSelectedProductId(itemId);
    } else if (route === 'journal' && itemId) {
      setSelectedProductId(itemId);
    } else {
      setSelectedProductId(null);
    }

    if (route === 'track-order') {
      setIsTrackOrderOpen(true);
    } else if (route === 'routine-finder') {
      setIsQuizOpen(true);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      const productMatch = window.location.pathname.match(/^\/product\/(.+)$/);
      const journalMatch = window.location.pathname.match(/^\/journal\/(.+)$/);
      if (productMatch) {
        setCurrentRoute('product');
        setSelectedProductId(productMatch[1]);
      } else if (journalMatch) {
        setCurrentRoute('journal');
        setSelectedProductId(journalMatch[1]);
      } else {
        setCurrentRoute(path || 'home');
        setSelectedProductId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleAddCustomBundleToCart = (bundleItems: Product[], totalPrice: number) => {
    const customBundleProduct: Product = {
      id: `custom-bundle-${Date.now()}`,
      name: 'Custom B.Y.O.G. Radiance Kit (3 Pieces)',
      subtitle: bundleItems.map(i => i.name).join(' + '),
      tagline: 'Personalized Botanical Bundle',
      price: totalPrice || 1800,
      rating: 5.0,
      reviewCount: 1,
      category: 'kits',
      image: '/images/glow-kit.png',
      badge: '🎁 COMPLETE 3-PIECE KIT',
      description: `Complete customized 3-step ritual featuring ${bundleItems.map(i => i.name).join(', ')}. Includes Free Pure Herbex Canvas Bag.`,
      benefits: [
        'Custom formulated 3-step ritual',
        'Complete 3-step botanical glow routine',
        'Free Pure Herbex Canvas Beach Tote'
      ],
      ingredients: bundleItems.flatMap(i => i.ingredients),
      usage: 'Use daily as directed on individual products.',
      size: 'Custom 3-Piece Kit',
      inStock: true
    };

    handleAddToCart(customBundleProduct, 1);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
    } else {
      setCartItems(prev => prev.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const flagshipProduct = productsList[0] || DEFAULT_PRODUCTS[0];
  const activeProduct = productsList.find(p => p.id === selectedProductId) || flagshipProduct;

  // ROUTE 1: Dedicated Admin Portal Route (/admin - accessed directly via URL)
  if (currentRoute === 'admin') {
    return (
      <>
        <SEOHead title="Admin Dashboard" path="/admin" />
        <AdminPortal />
      </>
    );
  }

  // Helper for opening track modal with code
  const openTrackWithCode = (code?: string) => {
    if (code) setTrackInitialCode(code);
    setIsTrackOrderOpen(true);
  };

  // Shared Header Props
  const headerProps = {
    cartCount,
    onNavigate: navigateTo,
    onOpenCart: () => setIsCartOpen(true),
    onOpenTrackOrder: () => openTrackWithCode(),
    onOpenAuthModal: () => setIsAuthOpen(true),
    onOpenQuiz: () => setIsQuizOpen(true),
    onSelectCategory: (cat: string) => { setSelectedCategory(cat); navigateTo('shop'); }
  };

  // Shared Footer Props
  const footerProps = {
    onNavigate: navigateTo,
    onOpenTrackOrder: () => openTrackWithCode(),
    onOpenQuiz: () => setIsQuizOpen(true),
    onSelectCategory: (cat: string) => { setSelectedCategory(cat); navigateTo('shop'); }
  };

  // Render Subpage content based on route
  const renderPageContent = () => {
    if (currentRoute === 'creators' || currentRoute === 'creator' || currentRoute === 'influencer' || currentRoute === 'affiliate') {
      return <CreatorPortal onNavigateHome={() => navigateTo('home')} onOpenShop={() => navigateTo('shop')} />;
    }
    if (currentRoute === 'product' && activeProduct) {
      return (
        <ProductDetail 
          product={activeProduct} 
          onAddToCart={handleAddToCart}
          onBack={() => navigateTo('shop')}
        />
      );
    }
    if (currentRoute === 'policies') {
      return <PoliciesPage onBack={() => navigateTo('home')} />;
    }
    if (currentRoute === 'story') {
      return (
        <div className="py-8">
          <BrandStory />
          <ReviewsSection />
        </div>
      );
    }
    if (currentRoute === 'shop') {
      return (
        <div className="py-8">
          <ProductGrid 
            products={productsList}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddToCart={handleAddToCart}
            onQuickView={(prod) => navigateTo('product', prod.id)}
          />
          <BuildYourBundle 
            products={productsList}
            onAddCustomBundleToCart={handleAddCustomBundleToCart}
          />
        </div>
      );
    }
    if (currentRoute === 'ingredients') {
      return <BotanicalGlossaryPage onNavigate={navigateTo} />;
    }
    if (currentRoute === 'journal') {
      return (
        <SkincareJournalPage 
          selectedArticleId={selectedProductId}
          onNavigate={navigateTo}
          onAddToCart={handleAddToCart}
        />
      );
    }
    if (currentRoute === 'faq') {
      return (
        <FAQPage 
          onNavigate={navigateTo}
          onOpenTrackOrder={() => openTrackWithCode()}
        />
      );
    }
    if (currentRoute === 'contact') {
      return <ContactPage />;
    }

    // Default: Home Page
    return (
      <>
        {/* Sun-Drenched Hero Section */}
        <Hero 
          flagshipProduct={flagshipProduct}
          onAddToCart={handleAddToCart}
          onViewDetails={(prod) => navigateTo('product', prod.id)}
          onOpenQuiz={() => setIsQuizOpen(true)}
        />

        {/* Build Your Own Glow (B.Y.O.G.) Custom Kit Section */}
        <BuildYourBundle 
          products={productsList}
          onAddCustomBundleToCart={handleAddCustomBundleToCart}
        />

        {/* Product Grid & Category Filter */}
        <ProductGrid 
          products={productsList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={handleAddToCart}
          onQuickView={(prod) => navigateTo('product', prod.id)}
        />

        {/* Brand Story & Efficacy ("Trust The Glow") */}
        <BrandStory />

        {/* Customer Reviews & Instagram Gallery */}
        <ReviewsSection />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-sun-sand flex flex-col font-sans selection:bg-sun-yellow selection:text-sun-dark">
      <SEOHead 
        isHome={currentRoute === 'home'}
        title={currentRoute === 'home' ? undefined : undefined}
        path={window.location.pathname}
        breadcrumbs={[
          { name: 'Home', url: '/' }
        ]}
      />

      {/* Auto-Applied Creator Promo Banner */}
      {promoBanner && (
        <div className="bg-sun-dark text-sun-yellow font-black py-2.5 px-4 text-xs sm:text-sm text-center border-b-2 border-sun-yellow flex items-center justify-center gap-2 animate-fade-in shadow-md">
          <span>{promoBanner}</span>
          <button 
            onClick={() => setPromoBanner(null)} 
            className="text-white hover:text-sun-yellow ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Header {...headerProps} />

      {/* Main Content Area */}
      <main className="flex-grow">
        {renderPageContent()}
      </main>

      {/* Footer */}
      <Footer {...footerProps} />

      {/* Slide-Over Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onAddToCart={handleAddToCart}
      />

      {/* Track Order Status Dialog */}
      <TrackOrderModal 
        isOpen={isTrackOrderOpen}
        onClose={() => {
          setIsTrackOrderOpen(false);
          setTrackInitialCode('');
        }}
        initialTrackingCode={trackInitialCode}
      />

      {/* Customer Account, Creator Signup & Wishlist Modal */}
      <CustomerAccountModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAddToCart={handleAddToCart}
        onOpenTrackOrder={(code) => openTrackWithCode(code)}
        onNavigateToCreators={() => navigateTo('creators')}
      />

      {/* Routine Finder 3-Step Quiz */}
      <RoutineFinder 
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        products={productsList}
        onAddToCart={handleAddToCart}
      />

      {/* Quick View Product Modal */}
      <QuickViewModal 
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Kovera Mascot Dialogue Widget */}
      <MascotWidget />

      {/* GDPR / ePrivacy Cookie Consent Banner */}
      <CookieConsentBanner onOpenPolicies={() => navigateTo('policies')} />
    </div>
  );
}

export default App;
