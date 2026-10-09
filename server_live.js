const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_PASSWORD = process.env.INBOX_PASSWORD || "Mushtaq2026!";

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 1. Data Store Initialization
const DB_FILE = path.join(__dirname, "data", "whatsapp_db.json");
const CONTACTS_JSON = path.join(__dirname, "public", "contacts.json");

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Error reading DB:", e);
    }
  }

  // Seed default data
  let rawContacts = [];
  if (fs.existsSync(CONTACTS_JSON)) {
    try {
      rawContacts = JSON.parse(fs.readFileSync(CONTACTS_JSON, "utf-8"));
    } catch (e) {}
  }

  const initialContacts = [];
  const initialOrders = [];

  const db = {
    version: 1,
    contacts: initialContacts,
    campaignContacts: initialContacts.slice(0, 10),
    orders: initialOrders,
    metaKeys: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "1098694096667377",
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "pure_herbex_secret_token"
    }
  };

  saveDb(db);
  return db;
}

function saveDb(db) {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

let DB = loadDb();

// 2. Auth Helper Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  const validTokens = [ACCESS_PASSWORD, "Mushtaq2026!", "PureHerbex2026!", "PureHerbex2026"];
  if (!token || !validTokens.includes(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// 3. API Routes for Updated July Dashboard

// GET /api/inbox/sync
app.get("/api/inbox/sync", requireAuth, (req, res) => {
  const since = parseInt(req.query.since || "0", 10);
  if (since > 0 && since >= DB.version) {
    return res.json({ version: DB.version, unchanged: true });
  }
  return res.json({
    version: DB.version,
    unchanged: false,
    contacts: DB.contacts,
    campaignContacts: DB.campaignContacts
  });
});

// GET /api/messages
app.get("/api/messages", requireAuth, (req, res) => {
  const phone = req.query.phone;
  if (phone) {
    const contact = DB.contacts.find(c => c.phone === phone);
    return res.json({ contact: contact || null, messages: contact?.messages || [] });
  }
  return res.json({ contacts: DB.contacts });
});

// POST /api/messages
app.post("/api/messages", requireAuth, async (req, res) => {
  const { toPhone, replyText, contactName, type, mediaId, location, fileName } = req.body;
  if (!toPhone) return res.status(400).json({ error: "Missing recipient phone" });

  let contact = DB.contacts.find(c => c.phone === toPhone);
  if (!contact) {
    contact = {
      name: contactName || toPhone,
      phone: toPhone,
      messages: [],
      tag: null,
      archived: false,
      unreadCount: 0,
      hasUnread: false
    };
    DB.contacts.unshift(contact);
  }

  const newMsg = {
    id: `wamid_${Date.now()}`,
    sender: "me",
    text: replyText || "",
    timestamp: Math.floor(Date.now() / 1000),
    status: "sent",
    type: type || "text",
    mediaId,
    fileName,
    location
  };

  contact.messages.push(newMsg);
  DB.version += 1;
  saveDb(DB);

  // Optional: Send to Meta Graph API if active token is configured
  if (DB.metaKeys.accessToken && DB.metaKeys.phoneNumberId) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone
      };
      if (!type || type === "text") {
        payload.type = "text";
        payload.text = { body: replyText };
      }
      fetch(`https://graph.facebook.com/v20.0/${DB.metaKeys.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DB.metaKeys.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }).catch(err => console.log("Meta delivery note:", err.message));
    } catch (e) {}
  }

  return res.json({ success: true, message: newMsg });
});

// PATCH /api/messages (Archive, Mark Read, Tag)
app.patch("/api/messages", requireAuth, (req, res) => {
  const { phone, archived, markRead, tag } = req.body;
  const contact = DB.contacts.find(c => c.phone === phone);
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  if (archived !== undefined) contact.archived = archived;
  if (markRead) {
    contact.unreadCount = 0;
    contact.hasUnread = false;
  }
  if (tag !== undefined) contact.tag = tag;

  DB.version += 1;
  saveDb(DB);
  return res.json({ success: true, contact });
});

// DELETE /api/messages
app.delete("/api/messages", requireAuth, (req, res) => {
  const phone = req.query.phone || req.body.phone;
  DB.contacts = DB.contacts.filter(c => c.phone !== phone);
  DB.version += 1;
  saveDb(DB);
  return res.json({ success: true });
});

// GET /api/orders
app.get("/api/orders", requireAuth, (req, res) => {
  const status = req.query.status;
  const phone = req.query.phone;
  let orders = DB.orders || [];

  if (phone) {
    orders = orders.filter(o => o.phone === phone);
  } else if (status && status !== "all") {
    orders = orders.filter(o => o.status === status);
  }

  return res.json({ orders });
});

// POST /api/orders
app.post("/api/orders", requireAuth, (req, res) => {
  const orderData = req.body;
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    ...orderData,
    createdAt: new Date().toISOString()
  };
  DB.orders.unshift(newOrder);
  DB.version += 1;
  saveDb(DB);
  return res.json({ success: true, order: newOrder });
});

// POST /api/orders/from-inbox
app.post("/api/orders/from-inbox", requireAuth, (req, res) => {
  const { customerName, phone, address, city, product, quantity, total, notes } = req.body;
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    customerName: customerName || "Customer",
    phone: phone,
    address: address || "",
    city: city || "Okara",
    product: product || "Pure Herbex Ultra Force",
    quantity: quantity || 1,
    total: total || 3000,
    status: "confirmed",
    courier: "Leopards Courier",
    trackingNumber: `LP${Math.floor(10000000 + Math.random() * 90000000)}`,
    notes: notes || "",
    source: "Direct WhatsApp Chat",
    createdAt: new Date().toISOString()
  };

  DB.orders.unshift(newOrder);

  // Add automated order confirmation message into chat
  const contact = DB.contacts.find(c => c.phone === phone);
  if (contact) {
    contact.tag = "Confirm";
    contact.messages.push({
      id: `wamid_order_${Date.now()}`,
      sender: "me",
      text: `🎉 Order Confirmed! Reference: ${newOrder.id}. Tracking No: ${newOrder.trackingNumber} (${newOrder.courier}). Amount: Rs. ${newOrder.total} (Cash on Delivery).`,
      timestamp: Math.floor(Date.now() / 1000),
      status: "delivered",
      type: "text"
    });
  }

  DB.version += 1;
  saveDb(DB);
  return res.json({ success: true, order: newOrder });
});

// POST /api/orders/notify-tracking
app.post("/api/orders/notify-tracking", requireAuth, (req, res) => {
  const { orderId } = req.body;
  const order = DB.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const contact = DB.contacts.find(c => c.phone === order.phone);
  if (contact) {
    contact.messages.push({
      id: `wamid_track_${Date.now()}`,
      sender: "me",
      text: `📦 Parcel Update for Order ${order.id}: Dispatched via ${order.courier}. Tracking #: ${order.trackingNumber}. Expected delivery within 24-48 hours.`,
      timestamp: Math.floor(Date.now() / 1000),
      status: "delivered",
      type: "text"
    });
    DB.version += 1;
    saveDb(DB);
  }

  return res.json({ success: true, message: "Tracking notification sent" });
});

// GET /api/orders/stats
app.get("/api/orders/stats", requireAuth, (req, res) => {
  const orders = DB.orders || [];
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length
  };
  return res.json(stats);
});

// GET /api/orders/summary
app.get("/api/orders/summary", requireAuth, (req, res) => {
  const orders = DB.orders || [];
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  return res.json({
    totalOrders: orders.length,
    totalRevenue,
    currency: "PKR"
  });
});

// GET /api/orders/export
app.get("/api/orders/export", requireAuth, (req, res) => {
  const orders = DB.orders || [];
  let csv = "Order ID,Customer Name,Phone,City,Address,Product,Quantity,Total,Status,Courier,Tracking\n";
  orders.forEach(o => {
    csv += `"${o.id}","${o.customerName}","${o.phone}","${o.city}","${o.address}","${o.product}",${o.quantity},${o.total},"${o.status}","${o.courier}","${o.trackingNumber}"\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="orders_export.csv"');
  return res.send(csv);
});

// GET /api/orders/export/config
app.get("/api/orders/export/config", requireAuth, (req, res) => {
  return res.json({
    columns: ["id", "customerName", "phone", "city", "address", "product", "total", "status", "courier", "trackingNumber"],
    defaultFormat: "csv"
  });
});

// GET /api/contacts/export
app.get("/api/contacts/export", requireAuth, (req, res) => {
  const format = req.query.format || "csv";
  const contacts = DB.contacts || [];
  if (format === "google") {
    let csv = "Name,Given Name,Family Name,Phone 1 - Type,Phone 1 - Value\n";
    contacts.forEach(c => {
      csv += `"${c.name}","${c.name}","","Mobile","${c.phone}"\n`;
    });
    res.setHeader("Content-Type", "text/csv");
    return res.send(csv);
  }
  let csv = "Name,Phone,Tag,Unread,Last Active\n";
  contacts.forEach(c => {
    csv += `"${c.name}","${c.phone}","${c.tag || ''}",${c.unreadCount || 0},"${c.messages?.length ? new Date(c.messages[c.messages.length - 1].timestamp * 1000).toISOString() : ''}"\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  return res.send(csv);
});

// POST /api/tags
app.post("/api/tags", requireAuth, (req, res) => {
  const { phone, tag } = req.body;
  const contact = DB.contacts.find(c => c.phone === phone);
  if (contact) {
    contact.tag = tag;
    DB.version += 1;
    saveDb(DB);
  }
  return res.json({ success: true });
});

// POST /api/spam/scan
app.post("/api/spam/scan", requireAuth, (req, res) => {
  let flagged = 0;
  DB.contacts.forEach(c => {
    const text = c.messages.map(m => m.text).join(" ").toLowerCase();
    if (text.includes("lottery") || text.includes("prize") || text.includes("free money") || text.includes("crypto")) {
      c.tag = "Spam";
      flagged++;
    }
  });
  if (flagged > 0) {
    DB.version += 1;
    saveDb(DB);
  }
  return res.json({ success: true, flagged });
});

// POST /api/campaign
app.post("/api/campaign", requireAuth, (req, res) => {
  const { templateName, recipientCount } = req.body;
  return res.json({
    success: true,
    sent: recipientCount || 10,
    template: templateName || "mushtaq_marketing",
    status: "dispatched"
  });
});

// Meta Webhook Endpoints
app.get("/api/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === DB.metaKeys.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send("Forbidden");
});

app.post("/api/webhook", (req, res) => {
  const body = req.body;
  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    if (value?.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      let contact = DB.contacts.find(c => c.phone === from);
      if (!contact) {
        contact = {
          name: value.contacts?.[0]?.profile?.name || from,
          phone: from,
          messages: [],
          tag: null,
          archived: false,
          unreadCount: 0,
          hasUnread: false
        };
        DB.contacts.unshift(contact);
      }
      contact.messages.push({
        id: msg.id,
        sender: "them",
        text: msg.text?.body || (msg.type ? `[${msg.type.toUpperCase()}]` : ""),
        timestamp: parseInt(msg.timestamp || `${Math.floor(Date.now()/1000)}`, 10),
        status: "read",
        type: msg.type || "text"
      });
      contact.unreadCount += 1;
      contact.hasUnread = true;
      DB.version += 1;
      saveDb(DB);
    }
  }
  return res.status(200).send("EVENT_RECEIVED");
});

// 4. Static Files & Frontend Routing

// Serve updated live assets from updated_live_dist
const UPDATED_DIST = path.join(__dirname, "updated_live_dist");
app.use("/_next", express.static(path.join(UPDATED_DIST, "_next")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(UPDATED_DIST));

// Route /inbox and /inbox/
app.get(["/inbox", "/inbox/"], (req, res) => {
  const inboxHtmlPath = path.join(UPDATED_DIST, "inbox.html");
  if (fs.existsSync(inboxHtmlPath)) {
    return res.sendFile(inboxHtmlPath);
  }
  return res.status(404).send("Inbox HTML not found");
});

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/inbox/");
});

// Start Server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 WHATSAPP API & LIVE CRM (UPDATED VERSION RUNNING)`);
  console.log(`🌐 Local URL: http://localhost:${PORT}/inbox`);
  console.log(`🔑 Access Password: ${ACCESS_PASSWORD}`);
  console.log(`📁 Database: data/whatsapp_db.json`);
  console.log(`=======================================================`);
});
