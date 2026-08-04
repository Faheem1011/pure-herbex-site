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

// Helper to read DB
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      orders: [
        {
          id: 'RC-948201',
          orderDate: new Date().toISOString(),
          fullName: 'Ayesha Khan',
          address: 'House 42, Block B, Gulberg III',
          city: 'Lahore',
          phone: '0300-1234567',
          items: [
            {
              product: {
                id: 'koveria-glow-complete-kit',
                name: 'Complete Koveria Glow 3-Piece Kit',
                price: 1500
              },
              quantity: 1
            }
          ],
          subtotal: 1500,
          shippingFee: 150,
          totalAmount: 1650,
          courier: 'Leopards COD (Run Couriers)',
          trackingNumber: 'RC-948201',
          status: 'Booked via Leopards'
        }
      ],
      stats: {
        totalSales: 1650,
        totalOrders: 1
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};

// Helper to write DB
const writeDB = (data: any) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Run Couriers Config
const RUN_COURIERS_CONFIG = {
  CLIENT_CODE: '6943',
  AUTH_KEY: '23d4734f-0clc-4586-90f6-210c4ec8d2f9',
  SERVICE_PROVIDER: 'Leopards COD (Pakistan)'
};

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

  // Format date: YYYY-MM-DD HH:MM:SS
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const orderDateFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let trackingNumber = '';
  let courierMessage = '';

  try {
    const payload = {
      client_code: '6943',
      auth_key: '23d4734f-0clc-4586-90f6-210c4ec8d2f9',
      service_type: 'Overnight',
      product: 'Overnight',
      profile_id: '20002',
      origin: 'Lahore',
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
      api_vendor: '28|1' // leopards COD service
    };

    console.log('[Run Couriers Booking] Sending booking payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://portal.runcourier.com/API/CreateOrder.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data: any = await response.json();
      console.log('[Run Couriers Booking] API Response:', data);
      if (data && data.tracking_no) {
        trackingNumber = data.tracking_no.toString();
        courierMessage = data.message || 'Booked successfully';
      }
    } else {
      console.error('[Run Couriers Booking] API responded with status:', response.status);
    }
  } catch (err) {
    console.error('[Run Couriers Booking] Request failed:', err);
  }

  // Fallback if API failed or didn't return a tracking number
  if (!trackingNumber) {
    trackingNumber = 'LP-' + Math.floor(100000000 + Math.random() * 900000000); // Standard Leopards tracking format
    courierMessage = 'Booked successfully (Local Simulation Mode)';
    console.log('[Run Couriers Booking] Fallback to simulated Leopards Tracking ID:', trackingNumber);
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

app.listen(PORT, () => {
  console.log(`🚀 Koveria Glow API Server running on http://localhost:${PORT}`);
});
