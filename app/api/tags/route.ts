import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone, tag } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
  }

  const db = await getDb();
  let contact = db.contacts.find((c) => c.phone === phone);
  if (!contact) {
    contact = {
      name: "WhatsApp Contact",
      phone: phone,
      messages: [],
      tag: tag || null,
      archived: false,
      unreadCount: 0,
      hasUnread: false,
    };
    db.contacts.unshift(contact);
  } else {
    contact.tag = tag || null;
  }

  await saveDb(db);
  return NextResponse.json({ status: "success", tag: contact.tag });
}
