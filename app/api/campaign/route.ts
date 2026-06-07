import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone } from "@/lib/blocked";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp-send";

export const maxDuration = 60;

type CampaignStatus = {
  status: "sent" | "failed";
  sentAt: number;
  messageId?: string;
  error?: string;
  name?: string;
  templateName?: string;
};

type CampaignStatusMap = Record<string, CampaignStatus>;

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


// GET: fetch campaign send status for all leads
export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
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
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      toPhone,
      contactName,
      city = "",
      templateName = "herbex_marketing",
      languageCode = "en",
      bodyVarCount = 0,
      batch = false,
      limit = 20,
    } = body;

    if (batch) {
      const statusMap: CampaignStatusMap = (await kv.get("whatsapp:campaign_status")) || {};
      const file = path.join(process.cwd(), "public", "contacts.json");
      const leads = JSON.parse(await readFile(file, "utf-8")) as { name: string; phone: string }[];
      const pending = leads.filter((l) => !statusMap[normalizePhone(l.phone)] || statusMap[normalizePhone(l.phone)]?.status === "failed");

      let sent = 0;
      let failed = 0;
      let skipped = 0;
      let firstError = "";

      for (const lead of pending.slice(0, Math.min(limit, 40))) {
        const phone = normalizePhone(lead.phone);
        if (await isPhoneBlocked(phone)) {
          skipped++;
          continue;
        }
        const result = await sendWhatsAppTemplateMessage(phone, templateName, {
          languageCode,
          bodyVarCount,
          name: lead.name,
          city: "",
        });
        if (result.ok) {
          sent++;
          await saveSentMessage(phone, lead.name, result.msgId || "N/A", templateName);
          await updateCampaignStatus(phone, {
            status: "sent",
            sentAt: Date.now(),
            messageId: result.msgId,
            name: lead.name,
            templateName,
          });
        } else {
          failed++;
          if (!firstError) firstError = result.error || "Unknown error";
          await updateCampaignStatus(phone, {
            status: "failed",
            sentAt: Date.now(),
            error: result.error,
            name: lead.name,
            templateName,
          });
        }
      }

      return NextResponse.json({
        status: "batch_complete",
        sent,
        failed,
        skipped,
        remaining: Math.max(0, pending.length - limit),
        firstError: firstError || undefined,
      });
    }

    if (!toPhone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const phone = normalizePhone(toPhone);
    const displayName = contactName || "Customer";

    if (await isPhoneBlocked(phone)) {
      return NextResponse.json({ error: "This contact is blocked." }, { status: 403 });
    }

    const result = await sendWhatsAppTemplateMessage(phone, templateName, {
      languageCode,
      bodyVarCount,
      name: displayName,
      city,
    });

    if (result.ok) {
      const msgId = result.msgId || "N/A";

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

    const errorMsg = result.error || "Failed to send template";
    await updateCampaignStatus(phone, {
      status: "failed",
      sentAt: Date.now(),
      error: errorMsg,
      name: displayName,
      templateName,
    });

    return NextResponse.json({ error: errorMsg }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: reset campaign status for a lead (mark as pending again)
export async function DELETE(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
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
