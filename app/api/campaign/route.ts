import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone } from "@/lib/blocked";
import type { InboxLine } from "@/lib/inbox-line";
import { resolveInboxLine } from "@/lib/inbox-request";
import { bumpInboxVersion } from "@/lib/inbox-sync";
import { campaignStatusKey } from "@/lib/kv-keys";
import { registerMarketingContact } from "@/lib/marketing-inbox";
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
  templateName: string,
  line: InboxLine = "main"
) {
  await registerMarketingContact(toPhone, contactName, {
    id: msgId,
    sender: "me",
    text: `📢 Marketing: ${templateName}`,
    timestamp: Math.floor(Date.now() / 1000),
    status: "sent",
    type: "template",
  }, line);
  await bumpInboxVersion(line);
}

async function saveFailedMessage(
  toPhone: string,
  contactName: string,
  error: string,
  templateName: string,
  line: InboxLine = "main"
) {
  await registerMarketingContact(toPhone, contactName, {
    id: `failed-${Date.now()}-${normalizePhone(toPhone)}`,
    sender: "me",
    text: `🚫 Failed: ${error}`,
    timestamp: Math.floor(Date.now() / 1000),
    status: "failed",
    type: "template",
  }, line);
  await bumpInboxVersion(line);
}

async function updateCampaignStatus(
  phone: string,
  entry: CampaignStatus,
  line: InboxLine = "main"
) {
  const normalized = normalizePhone(phone);
  const statusMap: CampaignStatusMap =
    (await kv.get(campaignStatusKey(line))) || {};
  statusMap[normalized] = entry;
  await kv.set(campaignStatusKey(line), statusMap);
}


// GET: fetch campaign send status for all leads
export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const line = resolveInboxLine(request);
    const status: CampaignStatusMap =
      (await kv.get(campaignStatusKey(line))) || {};

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
    const line = resolveInboxLine(request, body);
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
      const statusMap: CampaignStatusMap = (await kv.get(campaignStatusKey(line))) || {};
      const file = path.join(process.cwd(), "public", "contacts.json");
      const leads = JSON.parse(await readFile(file, "utf-8")) as { name: string; phone: string }[];
      const pending = leads.filter((l) => !statusMap[normalizePhone(l.phone)] || statusMap[normalizePhone(l.phone)]?.status === "failed");

      let sent = 0;
      let failed = 0;
      let skipped = 0;
      let firstError = "";

      for (const lead of pending.slice(0, Math.min(limit, 40))) {
        const phone = normalizePhone(lead.phone);
        if (await isPhoneBlocked(phone, line)) {
          skipped++;
          continue;
        }
        const result = await sendWhatsAppTemplateMessage(phone, templateName, {
          languageCode,
          bodyVarCount,
          name: lead.name,
          city: "",
          line,
        });
        if (result.ok) {
          sent++;
          await saveSentMessage(phone, lead.name, result.msgId || "N/A", templateName, line);
          await updateCampaignStatus(phone, {
            status: "sent",
            sentAt: Date.now(),
            messageId: result.msgId,
            name: lead.name,
            templateName,
          }, line);
        } else {
          failed++;
          const err = result.error || "Unknown error";
          if (!firstError) firstError = err;
          await saveFailedMessage(phone, lead.name, err, templateName, line);
          await updateCampaignStatus(phone, {
            status: "failed",
            sentAt: Date.now(),
            error: err,
            name: lead.name,
            templateName,
          }, line);
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

    if (await isPhoneBlocked(phone, line)) {
      return NextResponse.json({ error: "This contact is blocked." }, { status: 403 });
    }

    const result = await sendWhatsAppTemplateMessage(phone, templateName, {
      languageCode,
      bodyVarCount,
      name: displayName,
      city,
      line,
    });

    if (result.ok) {
      const msgId = result.msgId || "N/A";

      await saveSentMessage(phone, displayName, msgId, templateName, line);
      await updateCampaignStatus(phone, {
        status: "sent",
        sentAt: Date.now(),
        messageId: msgId,
        name: displayName,
        templateName,
      }, line);

      return NextResponse.json({ status: "success", msgId, phone });
    }

    const errorMsg = result.error || "Failed to send template";
    await saveFailedMessage(phone, displayName, errorMsg, templateName, line);
    await updateCampaignStatus(phone, {
      status: "failed",
      sentAt: Date.now(),
      error: errorMsg,
      name: displayName,
      templateName,
    }, line);

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

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const { phone } = body;
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const statusMap: CampaignStatusMap =
      (await kv.get(campaignStatusKey(line))) || {};
    delete statusMap[normalized];
    await kv.set(campaignStatusKey(line), statusMap);

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
