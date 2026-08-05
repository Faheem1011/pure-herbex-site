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
import { QuickViewModal } from './components/QuickViewModal';
import { AdminPortal } from './components/AdminPortal';
import { ProductDetail } from './components/ProductDetail';
import { PoliciesPage } from './components/PoliciesPage';
import { Footer } from './components/Footer';
import { MascotWidget } from './components/MascotWidget';

import { PRODUCTS as DEFAULT_PRODUCTS } from './data/products';
import { Product, CartItem } from './types';
import { fetchLiveProducts } from './services/supabase';

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

  // Dynamic Products List loaded from Database / Cache
  const [productsList, setProductsList] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pureherbex_products_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_PRODUCTS;
  });
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart & UI Dialog States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
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
  }, []);

  // Sync route changes with browser address bar & history
  const navigateTo = (route: string, productId?: string) => {
    let path = '/';
    if (route === 'admin') path = '/admin';
    else if (route === 'shop') path = '/shop';
    else if (route === 'story') path = '/story';
    else if (route === 'policies') path = '/policies';
    else if (route === 'track-order') path = '/track-order';
    else if (route === 'routine-finder') path = '/routine-finder';
    else if (route === 'product' && productId) path = `/product/${productId}`;

    window.history.pushState({}, '', path);
    setCurrentRoute(route);
    if (productId) {
      setSelectedProductId(productId);
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
      const match = window.location.pathname.match(/^\/product\/(.+)$/);
      if (match) {
        setCurrentRoute('product');
        setSelectedProductId(match[1]);
      } else {
        setCurrentRoute(path || 'home');
        setSelectedProductId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleAddCustomBundleToCart = (items: Product[], customPrice: number) => {
    const customBundleProduct: Product = {
      id: 'custom-byog-bundle-' + Date.now(),
      name: 'Custom B.Y.O.G. Glow Kit (3 Items)',
      subtitle: items.map(i => i.name).join(', '),
      tagline: 'Custom 3-Piece Kit + Free Canvas Bag',
      price: customPrice,
      rating: 5.0,
      reviewCount: 1,
      category: 'kits',
      image: '/images/glow-kit.png',
      description: 'Your custom 3-piece Koveria Glow routine with 20% discount applied.',
      benefits: ['Custom tailored skincare routine', 'Free Canvas Beach Tote Included'],
      ingredients: ['Custom selections'],
      usage: 'Use daily',
      size: '3 Full-size items',
      inStock: true
    };

    setCartItems(prev => [...prev, { product: customBundleProduct, quantity: 1 }]);
    setIsCartOpen(true);
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

  // ROUTE 1: Dedicated Admin Portal Route (/admin)
  if (currentRoute === 'admin') {
    return <AdminPortal />;
  }

  // ROUTE 2: Dedicated Product Detail Route (/product/:id)
  if (currentRoute === 'product' && activeProduct) {
    return (
      <div className="min-h-screen bg-sun-sand flex flex-col font-sans">
        <Header 
          cartCount={cartCount}
          onNavigate={navigateTo}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
        <main className="flex-grow">
          <ProductDetail 
            product={activeProduct} 
            onAddToCart={handleAddToCart}
            onBack={() => navigateTo('shop')}
          />
        </main>
        <Footer 
          onNavigate={navigateTo}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onAddToCart={handleAddToCart}
        />
      </div>
    );
  }

  // ROUTE 3: Dedicated Policies Page (/policies)
  if (currentRoute === 'policies') {
    return (
      <div className="min-h-screen bg-sun-sand flex flex-col font-sans">
        <Header 
          cartCount={cartCount}
          onNavigate={navigateTo}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
        <main className="flex-grow">
          <PoliciesPage onBack={() => navigateTo('home')} />
        </main>
        <Footer 
          onNavigate={navigateTo}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
      </div>
    );
  }

  // ROUTE 4: Dedicated Brand Story Page (/story)
  if (currentRoute === 'story') {
    return (
      <div className="min-h-screen bg-sun-sand flex flex-col font-sans">
        <Header 
          cartCount={cartCount}
          onNavigate={navigateTo}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
        <main className="flex-grow py-8">
          <BrandStory />
          <ReviewsSection />
        </main>
        <Footer 
          onNavigate={navigateTo}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
      </div>
    );
  }

  // ROUTE 5: Dedicated Shop Catalog Page (/shop)
  if (currentRoute === 'shop') {
    return (
      <div className="min-h-screen bg-sun-sand flex flex-col font-sans">
        <Header 
          cartCount={cartCount}
          onNavigate={navigateTo}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={setSelectedCategory}
        />
        <main className="flex-grow py-8">
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
        </main>
        <Footer 
          onNavigate={navigateTo}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
        />
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onAddToCart={handleAddToCart}
        />
      </div>
    );
  }

  // ROUTE 6: Main Homepage (/)
  return (
    <div className="min-h-screen bg-sun-sand flex flex-col font-sans selection:bg-sun-yellow selection:text-sun-dark">
      {/* Navigation Header */}
      <Header 
        cartCount={cartCount}
        onNavigate={navigateTo}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
      />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Sun-Drenched Hero Section */}
        <Hero 
          flagshipProduct={flagshipProduct}
          onAddToCart={handleAddToCart}
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
      </main>

      {/* Footer */}
      <Footer 
        onNavigate={navigateTo}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onSelectCategory={(cat) => { setSelectedCategory(cat); navigateTo('shop'); }}
      />

      {/* Slide-Over Cart Drawer with Upsell */}
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
        onClose={() => setIsTrackOrderOpen(false)}
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
    </div>
  );
}

export default App;
