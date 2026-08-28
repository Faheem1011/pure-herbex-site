import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'koveria-glow-complete-kit',
    name: 'Koveria Glow Face Pack Kit',
    subtitle: 'Complete 3-Piece Ritual (Face Pack + Night Toner + Rose Water)',
    tagline: 'Artisanal Handmade Radiance Ritual',
    price: 1800,
    rating: 5.0,
    reviewCount: 488,
    category: 'kits',
    image: '/images/glow-kit.png',
    badge: '🏆 COMPLETE 3-PIECE RITUAL',
    description: 'The ultimate 3-step artisanal herbal skincare routine combining Koveria Glow Face Pack, Koveria Glow Night Toner, and Koveria Glow Rose Water. Handcrafted in small batches with pure natural ingredients and proprietary botanical elixirs for complete skin transformation.',
    benefits: [
      '✴️ Brightens & even tones skin complexion',
      '✴️ Prevents Acne & clarifies clogged pores',
      '✴️ Gentle Exfoliation for smooth skin texture',
      '✴️ Soothes & boosts natural collagen production',
      '✴️ Anti-Aging protection & elasticity restore',
      '✴️ Instant Glow and baby soft skin after 1st use'
    ],
    ingredients: [
      'Rose Petals Powder', 
      'Moringa Powder', 
      'Organic Coffee', 
      'Pure Multani Mitti', 
      'Pure Aloe Vera Gel', 
      '100% Steam-Distilled Rose Water', 
      'Secret Botanical Elixirs'
    ],
    usage: 'Step 1: Mix 1 tbsp Face Pack with Rose Water. Apply for 15 mins. Step 2: Rinse and mist Night Toner to lock in deep botanical hydration.',
    size: 'Complete 3-Piece Full Ritual Set',
    inStock: true,
    isBestseller: true
  },
  {
    id: 'koveria-glow-face-pack',
    name: 'Koveria Glow Face Pack',
    subtitle: 'Artisanal Herbal Exfoliating Mask Powder',
    tagline: 'Pure Botanical Radiance Secret',
    price: 1399,
    rating: 4.9,
    reviewCount: 312,
    category: 'facepack',
    image: '/images/glow-facepack.png',
    badge: '🏆 #1 BESTSELLER',
    description: 'Freshly handmade herbal powder mask formulated with pure rose petals, moringa, premium coffee, and Multani mitti enhanced with secret botanical elixirs.',
    benefits: [
      '✴️ Brightens & even tones skin complexion',
      '✴️ Prevents Acne & draws out impurities',
      '✴️ Gentle Exfoliation & dead cell removal',
      '✴️ Soothes & boosts collagen',
      '✴️ Anti-Aging natural defense',
      '✴️ Instant Glow and baby soft skin'
    ],
    ingredients: ['Rose Petals Powder', 'Moringa Powder', 'Pure Coffee', 'Multani Mitti', 'Secret Herbal Elixir'],
    usage: 'Mix 1-2 spoonfuls with Koveria Glow Rose Water or Night Toner. Apply to face for 15 minutes, gently scrub and wash off.',
    size: '100g / 3.5 oz Herbal Powder',
    inStock: true,
    isBestseller: true
  },
  {
    id: 'koveria-glow-toner',
    name: 'Koveria Glow Night Toner',
    subtitle: 'Pure Aloe Vera & Botanical Hydrosol',
    tagline: 'Deep Overnight Hydration & Pore Tightening',
    price: 399,
    rating: 4.8,
    reviewCount: 194,
    category: 'toner',
    image: '/images/glow-tonner.png',
    badge: '🌿 ALOE HYDRATION',
    description: 'Refreshing herbal night hydration toner formulated with organic Aloe Vera gel and secret botanical extracts to soothe, hydrate, and tighten pores overnight.',
    benefits: [
      '✴️ Instantly calms redness and irritation',
      '✴️ Tightens pores & balances skin pH',
      '✴️ Deep non-greasy moisture barrier',
      '✴️ Boosts natural skin radiance'
    ],
    ingredients: ['Pure Aloe Vera Gel', 'Organic Hydrosol', 'Secret Hydration Formula'],
    usage: 'Spray directly on face after cleansing or mist before bedtime to lock in moisture.',
    size: '120ml / 4.0 fl. oz.',
    inStock: true
  },
  {
    id: 'pure-rose-water',
    name: 'Koveria Glow Rose Water',
    subtitle: '100% Organic Rosa Damascena Hydrosol',
    tagline: 'Nature’s Purest Skin Elixir',
    price: 170,
    rating: 4.9,
    reviewCount: 260,
    category: 'rosewater',
    image: '/images/glow-rose-water.png',
    badge: '🌸 100% PURE',
    description: 'Traditional steam-distilled pure rose water with zero artificial fragrances or preservatives. Ideal for mixing face packs or daily skin refreshing.',
    benefits: [
      '✴️ 100% pure steam-distilled rose hydrosol',
      '✴️ Refreshes sun-stressed, tired skin',
      '✴️ Natural toner & mixer for face packs',
      '✴️ Delivers an instant cooling sensation'
    ],
    ingredients: ['100% Pure Steam-Distilled Rose Water'],
    usage: 'Spritz generously onto face or use to blend the Koveria Glow Face Pack into a velvety paste.',
    size: '150ml / 5.0 fl. oz.',
    inStock: true
  }
];
