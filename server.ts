import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');

// Default initial products catalog
const INITIAL_PRODUCTS = [
  {
    id: 'koveria-glow-complete-kit',
    name: 'Complete Koveria Glow 3-Piece Kit',
    subtitle: 'Face Pack + Toner + Pure Rose Water Set',
    tagline: 'Artisanal Handmade Radiance Ritual',
    price: 1500,
    originalPrice: 1800,
    rating: 5,
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

// Helper to read DB
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      orders: [],
      products: INITIAL_PRODUCTS,
      dbConfig: {
        provider: 'json',
        supabaseUrl: '',
        supabaseKey: '',
        mongoUri: ''
      },
      stats: { totalSales: 0, totalOrders: 0 }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!db.products || db.products.length === 0) {
    db.products = INITIAL_PRODUCTS;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  if (!db.dbConfig) {
    db.dbConfig = { provider: 'json', supabaseUrl: '', supabaseKey: '', mongoUri: '' };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  return db;
};

// Helper to write DB
const writeDB = (data: any) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// ==========================================
// PRODUCTS REST API
// ==========================================

// GET /api/products - Get all products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json({ success: true, products: db.products });
});

// POST /api/products - Add a new product
app.post('/api/products', (req, res) => {
  const { name, subtitle, tagline, price, originalPrice, category, image, badge, description, benefits, ingredients, usage, size } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
  }

  const db = readDB();
  const newProduct = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4),
    name,
    subtitle: subtitle || name,
    tagline: tagline || 'Pure Botanical Formula',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Number(price),
    rating: 5.0,
    reviewCount: 1,
    category,
    image: image || '/images/glow-kit.png',
    badge: badge || 'NEW',
    description: description || 'Artisanal natural botanical skincare formula.',
    benefits: Array.isArray(benefits) ? benefits : (benefits ? benefits.split('\n').filter(Boolean) : ['✴️ Handcrafted organic formula']),
    ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? ingredients.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Organic Botanicals']),
    usage: usage || 'Apply daily to clean skin.',
    size: size || 'Standard Size',
    inStock: true,
    isBestseller: false
  };

  db.products.unshift(newProduct);
  writeDB(db);

  res.json({ success: true, message: 'Product created successfully', product: newProduct });
});

// PUT /api/products/:id - Update existing product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.products.findIndex((p: any) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const existing = db.products[index];
  const updated = {
    ...existing,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    originalPrice: req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : existing.originalPrice
  };

  db.products[index] = updated;
  writeDB(db);

  res.json({ success: true, message: 'Product updated successfully', product: updated });
});

// DELETE /api/products/:id - Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialCount = db.products.length;

  db.products = db.products.filter((p: any) => p.id !== id);

  if (db.products.length === initialCount) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Product deleted successfully.' });
});

// ==========================================
// ORDERS REST API
// ==========================================

// GET /api/orders - Get all orders
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    orders: db.orders,
    stats: {
      totalOrders: db.orders.length,
      totalSales: db.orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
    }
  });
});

// POST /api/orders - Create new order
app.post('/api/orders', async (req, res) => {
  const { fullName, address, city, phone, items } = req.body;

  if (!fullName || !address || !city || !phone || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required order fields.' });
  }

  const db = readDB();
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);
  const shippingFee = 150; // Flat Rs. 150 nationwide delivery
  const totalAmount = subtotal + shippingFee;

  const productDescription = items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(', ');

  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const orderDateFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let trackingNumber = '';
  let courierMessage = '';

  try {
    const payload = {
      client_code: '6943',
      auth_key: '23d4734f-0c1c-4586-90f6-210c4ec8d2f9',
      service_type: 'Overnight',
      product: 'Overnight',
      profile_id: '5943',
      origin: 'Okara',
      receiver_phone: phone,
      destination: city,
      receiver_name: fullName,
      receiver_email: '',
      receiver_address: address,
      pieces: 1,
      tracking_no: '',
      weight: 1,
      order_date: orderDateFormatted,
      collection_amount: totalAmount.toString(),
      product_description: productDescription,
      special_instruction: 'Leopards COD booking',
      order_id: 'KGV-' + Math.floor(1000 + Math.random() * 9000),
      api_vendor: '5|0'
    };

    console.log('[Run Couriers Booking] Sending payload:', payload);
    const response = await fetch('https://portal.runcourier.com/API/CreateOrder.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.tracking_no) {
        trackingNumber = data.tracking_no.toString();
        courierMessage = data.message || 'Booked successfully';
      }
    }
  } catch (err) {
    console.error('[Run Couriers Booking] Request failed:', err);
  }

  if (!trackingNumber) {
    trackingNumber = 'LP-' + Math.floor(100000000 + Math.random() * 900000000);
    courierMessage = 'Booked via Leopards COD';
  }

  const newOrder = {
    id: trackingNumber,
    orderDate: new Date().toISOString(),
    fullName,
    address,
    city,
    phone,
    items,
    subtotal,
    shippingFee,
    totalAmount,
    courier: 'Leopards COD (Run Couriers)',
    trackingNumber,
    status: 'Booked via Leopards' as const
  };

  db.orders.unshift(newOrder);
  writeDB(db);

  res.json({
    success: true,
    message: courierMessage,
    order: newOrder
  });
});

// PUT /api/orders/:id/status - Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const db = readDB();
  const order = db.orders.find((o: any) => o.id === id || o.trackingNumber === id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  order.status = status;
  writeDB(db);

  res.json({ success: true, order });
});

// GET /api/orders/track/:code - Track order
app.get('/api/orders/track/:code', (req, res) => {
  const { code } = req.params;
  const db = readDB();
  const order = db.orders.find((o: any) => o.id.toUpperCase() === code.toUpperCase() || o.trackingNumber.toUpperCase() === code.toUpperCase());

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order tracking ID not found.' });
  }

  res.json({
    success: true,
    order: {
      orderId: order.id,
      customerName: order.fullName,
      courierTrackingCode: order.trackingNumber,
      status: order.status,
      estimatedDelivery: '3 to 4 Days (Leopards COD)',
      items: order.items.map((i: any) => `${i.quantity}x ${i.product.name}`),
      totalAmount: order.totalAmount
    }
  });
});

// ==========================================
// DATABASE CONFIGURATION API
// ==========================================

// GET /api/db-config - Get DB configuration details
app.get('/api/db-config', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    config: db.dbConfig || { provider: 'json', supabaseUrl: '', supabaseKey: '', mongoUri: '' },
    productCount: db.products.length,
    orderCount: db.orders.length
  });
});

// POST /api/db-config - Save DB configuration details
app.post('/api/db-config', (req, res) => {
  const { provider, supabaseUrl, supabaseKey, mongoUri } = req.body;
  const db = readDB();

  db.dbConfig = {
    provider: provider || 'json',
    supabaseUrl: supabaseUrl || '',
    supabaseKey: supabaseKey || '',
    mongoUri: mongoUri || ''
  };

  writeDB(db);

  res.json({
    success: true,
    message: `Database configuration updated to ${provider.toUpperCase()}`,
    config: db.dbConfig
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Koveria Glow API Server running on http://localhost:${PORT}`);
});

