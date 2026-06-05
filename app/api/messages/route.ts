import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const accessToken = "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD";
const phoneNumberId = "1242577412261554";

// 1. GET: Fetch all active chats and message history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];
    
    // Quick security check against verify token or a static password
    if (sessionToken !== "PureHerbex2026!") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the list of active contact numbers
    const activeNumbers: string[] = await kv.smembers("whatsapp:active_contacts");
    
    const contacts = [];
    for (const phone of activeNumbers) {
      const contactData = await kv.get(`whatsapp:contact:${phone}`);
      if (contactData) {
        contacts.push(contactData);
      }
    }

    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Send a reply message to a contact
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (sessionToken !== "PureHerbex2026!") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toPhone, replyText, contactName } = await request.json();

    if (!toPhone || !replyText) {
      return NextResponse.json({ error: "Missing recipient or text content" }, { status: 400 });
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    
    // Call Meta API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
        type: "text",
        text: {
          preview_url: false,
          body: replyText
        }
      })
    });

    const respData = await response.json();

    if (response.ok) {
      const msgId = respData.messages?.[0]?.id || "N/A";

      // Save the sent message to KV store
      let contact: any = await kv.get(`whatsapp:contact:${toPhone}`);
      if (!contact) {
        contact = {
          name: contactName || "WhatsApp Contact",
          phone: toPhone,
          messages: []
        };
      } else if (contactName && contact.name === "WhatsApp Contact") {
        // If it was created automatically with default name, update it with custom name
        contact.name = contactName;
      }

      contact.messages.push({
        id: msgId,
        sender: "me",
        text: replyText,
        timestamp: Math.floor(Date.now() / 1000),
        status: "sent"
      });

      await kv.set(`whatsapp:contact:${toPhone}`, contact);
      await kv.sadd("whatsapp:active_contacts", toPhone);

      return NextResponse.json({ status: "success", msgId });
    } else {
      const errorMsg = respData.error?.message || "Failed to send message via Meta API";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
