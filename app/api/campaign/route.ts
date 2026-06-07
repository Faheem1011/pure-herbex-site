import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1098694096667377";
const AUTH_PASSWORD = "PureHerbex2026!";

type CampaignStatus = {
  status: "sent" | "failed";
  sentAt: number;
  messageId?: string;
  error?: string;
  name?: string;
  templateName?: string;
};

type CampaignStatusMap = Record<string, CampaignStatus>;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildTemplatePayload(
  toPhone: string,
  templateName: string,
  languageCode: string,
  bodyVarCount: number,
  name: string,
  city: string
) {
  const parameters: { type: "text"; text: string }[] = [];
  if (bodyVarCount >= 1) parameters.push({ type: "text", text: name });
  if (bodyVarCount >= 2) parameters.push({ type: "text", text: city });

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(toPhone),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  if (parameters.length > 0) {
    payload.template = {
      ...(payload.template as object),
      components: [{ type: "body", parameters }],
    };
  }

  return payload;
}

async function saveSentMessage(
  toPhone: string,
  contactName: string,
  msgId: string,
  templateName: string
) {
  const phone = normalizePhone(toPhone);
  let contact: any = await kv.get(`whatsapp:contact:${phone}`);
  if (!contact) {
    contact = { name: contactName, phone, messages: [] };
  } else if (contactName && contact.name === "WhatsApp Contact") {
    contact.name = contactName;
  }

  contact.messages.push({
    id: msgId,
    sender: "me",
    text: `📢 Marketing: ${templateName}`,
    timestamp: Math.floor(Date.now() / 1000),
    status: "sent",
    type: "template",
  });

  await kv.set(`whatsapp:contact:${phone}`, contact);
  await kv.sadd("whatsapp:active_contacts", phone);
}

async function updateCampaignStatus(
  phone: string,
  entry: CampaignStatus
) {
  const normalized = normalizePhone(phone);
  const statusMap: CampaignStatusMap =
    (await kv.get("whatsapp:campaign_status")) || {};
  statusMap[normalized] = entry;
  await kv.set("whatsapp:campaign_status", statusMap);
}

function checkAuth(request: NextRequest) {
  const sessionToken = request.headers.get("Authorization")?.split(" ")[1];
  return sessionToken === AUTH_PASSWORD;
}

// GET: fetch campaign send status for all leads
export async function GET(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status: CampaignStatusMap =
      (await kv.get("whatsapp:campaign_status")) || {};

    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: send approved marketing template to one lead
export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      toPhone,
      contactName,
      city = "",
      templateName = "herbex_marketing",
      languageCode = "en",
      bodyVarCount = 1,
    } = await request.json();

    if (!toPhone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const phone = normalizePhone(toPhone);
    const displayName = contactName || "Customer";

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = buildTemplatePayload(
      phone,
      templateName,
      languageCode,
      bodyVarCount,
      displayName,
      city
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const respData = await response.json();

    if (response.ok) {
      const msgId = respData.messages?.[0]?.id || "N/A";

      await saveSentMessage(phone, displayName, msgId, templateName);
      await updateCampaignStatus(phone, {
        status: "sent",
        sentAt: Date.now(),
        messageId: msgId,
        name: displayName,
        templateName,
      });

      return NextResponse.json({ status: "success", msgId, phone });
    }

    const errorMsg = respData.error?.message || "Failed to send template";
    await updateCampaignStatus(phone, {
      status: "failed",
      sentAt: Date.now(),
      error: errorMsg,
      name: displayName,
      templateName,
    });

    return NextResponse.json({ error: errorMsg, details: respData }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: reset campaign status for a lead (mark as pending again)
export async function DELETE(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const statusMap: CampaignStatusMap =
      (await kv.get("whatsapp:campaign_status")) || {};
    delete statusMap[normalized];
    await kv.set("whatsapp:campaign_status", statusMap);

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
