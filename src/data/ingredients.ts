export interface IngredientDetail {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  origin: string;
  image: string;
  summary: string;
  keyBenefits: string[];
  skinTypeSuitability: string[];
  scientificMechanism: string;
  relatedProductIds: string[];
}

export const INGREDIENTS_DATA: IngredientDetail[] = [
  {
    id: 'rose-petals-powder',
    name: 'Pure Damask Rose Petal Powder',
    scientificName: 'Rosa Damascena Flower Powder',
    category: 'Botanical Brightener & Anti-Aging',
    origin: 'Hand-picked organic Damask Roses from ancient rose valleys',
    image: '/images/glow-rose-water.png',
    summary: 'Cold-milled dried petals rich in Natural Vitamin C, polyphenol antioxidants, and soothing essential tannins. Gently fades dark spots while restoring youthful skin elasticity.',
    keyBenefits: [
      'Natural Vitamin C brightens dull & uneven skin complexion',
      'High polyphenol content fights oxidative free radical damage',
      'Natural astringent properties tighten enlarged pores',
      'Deeply calms redness, sun flare-ups, and skin sensitivities'
    ],
    skinTypeSuitability: ['All Skin Types', 'Sensitive Skin', 'Mature Skin', 'Sun-Stressed Skin'],
    scientificMechanism: 'Rich in L-ascorbic acid precursors and quercetin bioflavonoids, rose petal powder inhibits tyrosinase enzymes to reduce melanin production while stimulating natural collagen synthesis.',
    relatedProductIds: ['koveria-glow-complete-kit', 'koveria-glow-face-pack']
  },
  {
    id: 'moringa-leaf-extract',
    name: 'Organic Moringa Leaf Extract',
    scientificName: 'Moringa Oleifera Leaf Powder',
    category: 'Superfood Detox & Anti-Pollution',
    origin: 'Organically cultivated Miracle Tree leaves',
    image: '/images/glow-facepack.png',
    summary: 'Known as the "Miracle Tree," Moringa contains 46 antioxidants and 90+ nutrients. Protects skin against urban smog, environmental pollutants, and premature cell aging.',
    keyBenefits: [
      'Protects against urban pollution & micro-particulate damage',
      'High Vitamin A & E content repairs compromised skin barrier',
      'Purifies clogged pores and balances excess sebum oil',
      'Promotes cellular turnover for a fresh, healthy radiance'
    ],
    skinTypeSuitability: ['Oily & Acne-Prone', 'Combination Skin', 'Pollution-Exposed Skin'],
    scientificMechanism: 'Moringa contains zeatin, a plant hormone that accelerates cell division and tissue growth, along with high concentrations of chlorophyll that detoxify cellular debris.',
    relatedProductIds: ['koveria-glow-complete-kit', 'koveria-glow-face-pack']
  },
  {
    id: 'organic-arabica-coffee',
    name: 'Fine Ground Organic Arabica Coffee',
    scientificName: 'Coffea Arabica Seed Powder',
    category: 'Exfoliant & Micro-Circulation Booster',
    origin: 'Single-origin shade-grown organic Arabica beans',
    image: '/images/glow-facepack.png',
    summary: 'Finely ground organic coffee beans deliver gentle mechanical exfoliation while active caffeine stimulates micro-circulation to reduce puffiness and dullness.',
    keyBenefits: [
      'Gently buffs away dead skin cells for silky smoothness',
      'Active caffeine constricts blood vessels to reduce puffiness',
      'Ferulic acid boosts natural UV damage protection',
      'Improves skin firmness and texture'
    ],
    skinTypeSuitability: ['Dull Skin', 'Rough Texture', 'Combination Skin'],
    scientificMechanism: 'Topical caffeine acts as a vasoconstrictor and adenosine receptor antagonist, temporarily tightening tissue while stimulating lymphatic drainage.',
    relatedProductIds: ['koveria-glow-complete-kit', 'koveria-glow-face-pack']
  },
  {
    id: 'multani-mitti',
    name: 'Pure Himalayan Multani Mitti (Fuller’s Earth)',
    scientificName: 'Solum Fullonum',
    category: 'Deep Clay Clarifier & Oil Absorber',
    origin: 'Glacial mineral sediment deposits',
    image: '/images/glow-kit.png',
    summary: 'Magnesium chloride rich natural clay deposit renowned for centuries in Ayurvedic skin detox rituals. Absorbs excess sebum oil, draws out deep blackheads, and cools inflamed skin.',
    keyBenefits: [
      'Deeply cleanses congested pores and removes stubborn impurities',
      'Absorbs excess surface sebum without stripping natural moisture',
      'Delivers an instant cooling effect to sun-heated skin',
      'Refines rough skin texture for a poreless velvet finish'
    ],
    skinTypeSuitability: ['Oily Skin', 'Acne-Prone Skin', 'Large Pores'],
    scientificMechanism: 'Montmorillonite silicate minerals exhibit high cation exchange capacity, physically drawing positively charged toxin particles and lipids out of hair follicles.',
    relatedProductIds: ['koveria-glow-complete-kit', 'koveria-glow-face-pack']
  },
  {
    id: 'steam-distilled-rose-water',
    name: '100% Steam-Distilled Rose Water Hydrosol',
    scientificName: 'Rosa Damascena Flower Water',
    category: 'Pure Hydrosol & pH Balancer',
    origin: 'Traditional copper pot steam distillation',
    image: '/images/glow-rose-water.png',
    summary: 'Pure aromatic hydrosol captured during essential oil steam distillation. Restores natural skin pH (5.5), delivers oil-free hydration, and locks in moisture after face pack rituals.',
    keyBenefits: [
      'Instantly restores ideal skin pH balance after cleansing',
      'Delivers weightless, non-greasy hydration to dehydrated skin',
      'Soothes sun redness and reduces razor or wax irritation',
      '100% pure with zero added water, alcohol, or artificial perfume'
    ],
    skinTypeSuitability: ['All Skin Types', 'Dehydrated Skin', 'Sensitive Skin'],
    scientificMechanism: 'Distilled rose hydrosol carries micro-droplets of rose essential oil containing geraniol and citronellol, offering natural antimicrobial and skin-barrier smoothing properties.',
    relatedProductIds: ['koveria-glow-complete-kit', 'pure-rose-water', 'koveria-glow-toner']
  },
  {
    id: 'organic-aloe-vera-gel',
    name: 'Fresh Organic Aloe Vera Inner Leaf Gel',
    scientificName: 'Aloe Barbadensis Leaf Juice',
    category: 'Deep Hydration & Barrier Repair',
    origin: 'Cold-pressed organic Aloe Barbadensis leaves',
    image: '/images/glow-tonner.png',
    summary: 'Concentrated inner-leaf polysaccharide gel that delivers 99% pure bio-active moisture. Accelerates skin cell healing, calms sun exposure, and binds water deep within the epidermis.',
    keyBenefits: [
      'Cools and relieves UV sun heat & environmental redness',
      'Acemannan polysaccharides stimulate skin repair & renewal',
      'Provides deep moisture without clogging oily pores',
      'Leaves skin plump, supple, and dew-drenched'
    ],
    skinTypeSuitability: ['Sun-Exposed Skin', 'Dehydrated Skin', 'Sensitive & Reactive Skin'],
    scientificMechanism: 'Acemannan long-chain carbohydrates bind with epidermal growth factor receptors, triggering macrophage activity and collagen synthesis.',
    relatedProductIds: ['koveria-glow-complete-kit', 'koveria-glow-toner']
  }
];
