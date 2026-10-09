import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";

const DB_FILE = path.join(process.cwd(), "data", "whatsapp_db.json");

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: number;
  status?: string;
  type?: string;
  mediaId?: string;
  fileName?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface Contact {
  name: string;
  phone: string;
  messages: Message[];
  tag?: string | null;
  archived?: boolean;
  unreadCount?: number;
  hasUnread?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address?: string;
  city?: string;
  product?: string;
  quantity?: number;
  total?: number;
  status?: string;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
  source?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  version: number;
  contacts: Contact[];
  campaignContacts?: Contact[];
  orders?: Order[];
  metaKeys?: {
    accessToken?: string;
    phoneNumberId?: string;
    verifyToken?: string;
  };
}

function loadDefaultFileDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read local DB file:", e);
  }

  return {
    version: 1,
    contacts: [],
    campaignContacts: [],
    orders: [],
  };
}

// In-memory cache for serverless invocation lifecycle
let memoryDb: DatabaseSchema | null = null;

export async function getDb(): Promise<DatabaseSchema> {
  // 1. Try Vercel KV if available
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const kvData = await kv.get<DatabaseSchema>("mushtaq:db");
      if (kvData && kvData.contacts) {
        return kvData;
      }
    }
  } catch (err) {
    console.warn("KV fetch failed, falling back to local store:", err);
  }

  // 2. Memory cache
  if (memoryDb) {
    return memoryDb;
  }

  // 3. Local file load
  memoryDb = loadDefaultFileDb();
  return memoryDb;
}

export async function saveDb(db: DatabaseSchema): Promise<void> {
  db.version = (db.version || 0) + 1;
  memoryDb = db;

  // 1. Try Vercel KV
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set("mushtaq:db", db);
    }
  } catch (err) {
    console.warn("KV save error:", err);
  }

  // 2. Try writing local file if filesystem is writable
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    // Read-only filesystem on Vercel is expected
  }
}

export function isAuthorized(authHeader?: string | null): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const validTokens = [
    process.env.INBOX_PASSWORD || "Mushtaq2026!",
    "Mushtaq2026!",
    "PureHerbex2026!",
    "PureHerbex2026",
    "mushtaq_secret_token",
    "pure_herbex_secret_token"
  ];
  return validTokens.includes(token);
}
