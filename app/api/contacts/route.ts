import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized, Contact } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    return NextResponse.json({
      success: true,
      contacts: db.contacts || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 7) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const contactName = String(name || "").trim() || "WhatsApp Contact";

    const db = await getDb();
    if (!db.contacts) db.contacts = [];

    let existing = db.contacts.find((c) => c.phone === cleanPhone);
    if (!existing) {
      existing = {
        name: contactName,
        phone: cleanPhone,
        messages: [],
        unreadCount: 0,
        hasUnread: false
      };
      db.contacts.unshift(existing);
    } else {
      existing.name = contactName;
    }

    await saveDb(db);

    return NextResponse.json({
      success: true,
      contact: existing,
      contacts: db.contacts
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create contact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const db = await getDb();
    db.contacts = (db.contacts || []).filter((c) => c.phone !== phone);
    await saveDb(db);

    return NextResponse.json({
      success: true,
      contacts: db.contacts
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete contact" }, { status: 500 });
  }
}
