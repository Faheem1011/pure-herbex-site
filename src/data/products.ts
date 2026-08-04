import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'koveria-glow-complete-kit',
    name: 'Complete Koveria Glow 3-Piece Kit',
    subtitle: 'Face Pack + Toner + Pure Rose Water Set',
    tagline: 'Artisanal Handmade Radiance Ritual',
    price: 1500,
    originalPrice: 1800,
    rating: 5.0,
    reviewCount: 488,
    category: 'kits',
    image: '/images/glow-kit.png',
    badge: '🎁 BEST VALUE - SAVE RS. 300',
    description: 'The ultimate 3-step artisanal herbal skincare routine. Handcrafted in small batches with pure natural ingredients and proprietary secret botanical elixirs for complete skin transformation.',
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
    usage: 'Mix 1 tbsp Face Pack with Rose Water or Toner. Apply for 15 mins. Rinse and spray Toner to lock in moisture.',
    size: 'Complete 3-Piece Full Ritual Set',
    inStock: true,
    isBestseller: true
  },
  {
    id: 'koveria-glow-face-pack',
    name: 'Koveria Glow Face Pack (Powder)',
    subtitle: 'Artisanal Herbal Exfoliating Mask',
    tagline: 'Pure Botanical Radiance Secret',
    price: 1399,
    originalPrice: 1600,
    rating: 4.9,
    reviewCount: 312,
    category: 'facepack',
    image: '/images/glow-serum.png',
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
    usage: 'Mix 1-2 spoonfuls with Rose Water or yogurt. Apply to face for 15 minutes, gently scrub and wash off.',
    size: '100g / 3.5 oz Herbal Powder',
    inStock: true,
    isBestseller: true
  },
  {
    id: 'koveria-glow-toner',
    name: 'Koveria Glow Hydrating Toner',
    subtitle: 'Pure Aloe Vera & Botanical Hydrosol',
    tagline: 'Deep Hydration & Pore Tightening',
    price: 399,
    originalPrice: 500,
    rating: 4.8,
    reviewCount: 194,
    category: 'toner',
    image: '/images/glow-mist.png',
    badge: '🌿 ALOE HYDRATION',
    description: 'Refreshing herbal hydration toner formulated with organic Aloe Vera gel and secret botanical extracts to soothe, hydrate, and tighten pores.',
    benefits: [
      '✴️ Instantly calms redness and irritation',
      '✴️ Tightens pores & balances skin pH',
      '✴️ Deep non-greasy moisture barrier',
      '✴️ Boosts natural skin radiance'
    ],
    ingredients: ['Pure Aloe Vera Gel', 'Organic Hydrosol', 'Secret Hydration Formula'],
    usage: 'Spray directly on face after cleansing or mist throughout the day whenever skin feels dry.',
    size: '120ml / 4.0 fl. oz.',
    inStock: true
  },
  {
    id: 'pure-rose-water',
    name: 'Pure Steam-Distilled Rose Water',
    subtitle: '100% Organic Rosa Damascena Hydrosol',
    tagline: 'Nature’s Purest Skin Elixir',
    price: 170,
    originalPrice: 220,
    rating: 4.9,
    reviewCount: 260,
    category: 'rosewater',
    image: '/images/glow-elixir.png',
    badge: '🌸 100% PURE',
    description: 'Traditional steam-distilled pure rose water with zero artificial fragrances or preservatives. Ideal for mixing face packs or daily skin refreshing.',
    benefits: [
      '✴️ 100% pure steam-distilled rose hydrosol',
      '✴️ Refreshes sun-stressed, tired skin',
      '✴️ Natural toner & mixer for face packs',
      '✴️ Delivers an instant cooling sensation'
    ],
    ingredients: ['100% Pure Steam-Distilled Rose Water'],
    usage: 'Spritz generously onto face or use to blend the Koveria Glow Face Pack into a paste.',
    size: '150ml / 5.0 fl. oz.',
    inStock: true
  }
];
