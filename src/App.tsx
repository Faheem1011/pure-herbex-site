import React, { useState } from 'react';
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
import { Footer } from './components/Footer';
import { MascotWidget } from './components/MascotWidget';

import { PRODUCTS } from './data/products';
import { Product, CartItem } from './types';

export function App() {
  // Detect dedicated URL path for internal admin access
  const isAdminPath = window.location.pathname === '/admin';

  if (isAdminPath) {
    return <AdminPortal />;
  }

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const flagshipProduct = PRODUCTS[0]; // Koveria Glow Complete Kit (Rs. 1,500)

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

  return (
    <div className="min-h-screen bg-sun-sand flex flex-col font-sans selection:bg-sun-yellow selection:text-sun-dark">
      {/* Navigation Header */}
      <Header 
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onSelectCategory={setSelectedCategory}
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
          products={PRODUCTS}
          onAddCustomBundleToCart={handleAddCustomBundleToCart}
        />

        {/* Product Grid & Category Filter */}
        <ProductGrid 
          products={PRODUCTS}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={handleAddToCart}
          onQuickView={setQuickViewProduct}
        />

        {/* Brand Story & Efficacy ("Trust The Glow") */}
        <BrandStory />

        {/* Customer Reviews & Instagram Gallery */}
        <ReviewsSection />
      </main>

      {/* Footer */}
      <Footer 
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onSelectCategory={setSelectedCategory}
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
        products={PRODUCTS}
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
