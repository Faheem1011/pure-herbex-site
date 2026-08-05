import { createClient } from '@supabase/supabase-js';
import { Product, Order } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';

// Live Supabase Production Configuration (Retrieved via Supabase MCP)
const SUPABASE_URL = 'https://ycxsitqyhhsfcgxifsov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNpdHF5aGhzZmNneGlmc292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDI5MjEsImV4cCI6MjEwMTUxODkyMX0.sYL1Rj_dxzLqVUbjExhT3TwZMof6rFeFLBN36DpkvpM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// PRODUCTS SERVICE
// ==========================================

export async function fetchLiveProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        subtitle: item.subtitle || item.name,
        tagline: item.tagline || 'Pure Botanical Formula',
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : Number(item.price),
        rating: Number(item.rating || 5.0),
        reviewCount: Number(item.review_count || 1),
        category: item.category || 'kits',
        image: item.image || '/images/glow-kit.png',
        badge: item.badge || '',
        description: item.description || '',
        benefits: Array.isArray(item.benefits) ? item.benefits : DEFAULT_PRODUCTS[0].benefits,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : DEFAULT_PRODUCTS[0].ingredients,
        usage: item.usage || 'Apply daily',
        size: item.size || 'Standard Size',
        inStock: item.in_stock !== false,
        isBestseller: Boolean(item.is_bestseller)
      }));
    }
  } catch (err) {
    console.warn('[Supabase Products] Fetch error, using fallback', err);
  }

  // Fallback to cache or default products
  const cached = localStorage.getItem('pureherbex_products_db');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  localStorage.setItem('pureherbex_products_db', JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

export async function seedDefaultCatalog(): Promise<Product[]> {
  localStorage.setItem('pureherbex_products_db', JSON.stringify(DEFAULT_PRODUCTS));
  try {
    for (const prod of DEFAULT_PRODUCTS) {
      await saveLiveProduct(prod);
    }
  } catch (err) {
    console.warn('[Seed Catalog Error]', err);
  }
  return DEFAULT_PRODUCTS;
}

export async function saveLiveProduct(product: Product): Promise<boolean> {
  const existing = await fetchLiveProducts();
  const index = existing.findIndex(p => p.id === product.id);
  let updatedList: Product[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = product;
  } else {
    updatedList = [product, ...existing];
  }
  localStorage.setItem('pureherbex_products_db', JSON.stringify(updatedList));

  try {
    const payload = {
      id: product.id,
      name: product.name,
      subtitle: product.subtitle,
      tagline: product.tagline,
      price: product.price,
      original_price: product.originalPrice,
      category: product.category,
      image: product.image,
      badge: product.badge,
      description: product.description,
      benefits: product.benefits,
      ingredients: product.ingredients,
      usage: product.usage,
      size: product.size,
      in_stock: product.inStock,
      is_bestseller: product.isBestseller
    };

    await supabase.from('products').upsert(payload);
  } catch (err) {
    console.warn('[Supabase Save Product Error]', err);
  }

  return true;
}

export async function deleteLiveProduct(productId: string): Promise<boolean> {
  const existing = await fetchLiveProducts();
  const updatedList = existing.filter(p => p.id !== productId);
  localStorage.setItem('pureherbex_products_db', JSON.stringify(updatedList));

  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (err) {
    console.warn('[Supabase Delete Product Error]', err);
  }

  return true;
}

// ==========================================
// ORDERS SERVICE
// ==========================================

export async function submitCustomerOrder(orderData: {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  items: any[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}): Promise<Order> {
  const trackingNumber = 'LP-' + Math.floor(100000000 + Math.random() * 900000000);
  const newOrder: Order = {
    id: trackingNumber,
    orderDate: new Date().toISOString(),
    fullName: orderData.fullName,
    address: orderData.address,
    city: orderData.city,
    phone: orderData.phone,
    items: orderData.items,
    subtotal: orderData.subtotal,
    shippingFee: orderData.shippingFee,
    totalAmount: orderData.totalAmount,
    courier: 'Leopards COD (Run Couriers)',
    trackingNumber: trackingNumber,
    status: 'Booked via Leopards'
  };

  // 1. Insert into Supabase Orders Cloud Table (Primary Action)
  try {
    const payload = {
      id: newOrder.id,
      order_date: newOrder.orderDate,
      full_name: newOrder.fullName,
      address: newOrder.address,
      city: newOrder.city,
      phone: newOrder.phone,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      shipping_fee: newOrder.shippingFee,
      total_amount: newOrder.totalAmount,
      courier: newOrder.courier,
      tracking_number: newOrder.trackingNumber,
      status: newOrder.status
    };

    const { data, error } = await supabase.from('orders').upsert(payload).select();
    if (error) {
      console.error('[Supabase Insert Order Error]', error.message, error.details);
    } else {
      console.log('✅ Order synced live with Supabase Cloud DB:', data);
    }
  } catch (err) {
    console.error('[Supabase Insert Order Exception]', err);
  }

  // 2. Save to Local Cache as secondary backup
  try {
    const existingSaved = localStorage.getItem('pureherbex_orders_db');
    let ordersList: Order[] = [];
    if (existingSaved) {
      try { ordersList = JSON.parse(existingSaved); } catch (e) {}
    }
    ordersList.unshift(newOrder);
    localStorage.setItem('pureherbex_orders_db', JSON.stringify(ordersList));
  } catch (e) {}

  // 3. Non-blocking Run Couriers Leopards API booking
  setTimeout(() => {
    try {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const now = new Date();
      const orderDateFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const productDescription = orderData.items.map((i: any) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ');

      const courierPayload = {
        client_code: '6943',
        auth_key: '23d4734f-0c1c-4586-90f6-210c4ec8d2f9',
        service_type: 'Overnight',
        product: 'Overnight',
        profile_id: '5943',
        origin: 'Okara',
        receiver_phone: orderData.phone,
        destination: orderData.city,
        receiver_name: orderData.fullName,
        receiver_email: '',
        receiver_address: orderData.address,
        pieces: 1,
        tracking_no: '',
        weight: 1,
        order_date: orderDateFormatted,
        collection_amount: orderData.totalAmount.toString(),
        product_description: productDescription,
        special_instruction: 'Leopards COD booking',
        order_id: 'KGV-' + Math.floor(1000 + Math.random() * 9000),
        api_vendor: '5|0'
      };

      fetch('https://portal.runcourier.com/API/CreateOrder.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courierPayload)
      }).catch(err => console.warn('[Run Couriers Notice]', err));
    } catch (err) {
      console.warn('[Run Couriers Booking Notice]', err);
    }
  }, 100);

  return newOrder;
}

export async function fetchLiveOrders(): Promise<{ orders: Order[]; stats: { totalOrders: number; totalSales: number } }> {
  let loadedOrders: Order[] = [];

  // Read Supabase Cloud DB First
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      loadedOrders = data.map((item: any) => ({
        id: item.id || item.tracking_number,
        orderDate: item.order_date || item.created_at || new Date().toISOString(),
        fullName: item.full_name,
        address: item.address,
        city: item.city,
        phone: item.phone,
        items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items,
        subtotal: Number(item.subtotal),
        shippingFee: Number(item.shipping_fee || 150),
        totalAmount: Number(item.total_amount),
        courier: item.courier || 'Leopards COD (Run Couriers)',
        trackingNumber: item.tracking_number || item.id,
        status: item.status || 'Booked via Leopards'
      }));

      // Cache live Supabase orders locally
      localStorage.setItem('pureherbex_orders_db', JSON.stringify(loadedOrders));
    }
  } catch (err) {
    console.warn('[Supabase Fetch Orders Error]', err);
  }

  // Fallback to Local Cache if Supabase query returned no data or failed
  if (loadedOrders.length === 0) {
    const saved = localStorage.getItem('pureherbex_orders_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) loadedOrders = parsed;
      } catch (e) {}
    }
  }

  const totalSales = loadedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return {
    orders: loadedOrders,
    stats: {
      totalOrders: loadedOrders.length,
      totalSales
    }
  };
}

export async function updateLiveOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
  const { orders } = await fetchLiveOrders();
  const updated = orders.map(o => (o.id === orderId || o.trackingNumber === orderId) ? { ...o, status: newStatus as any } : o);
  localStorage.setItem('pureherbex_orders_db', JSON.stringify(updated));

  try {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .or(`id.eq.${orderId},tracking_number.eq.${orderId}`);
  } catch (err) {
    console.warn('[Supabase Update Status Error]', err);
  }

  return true;
}
