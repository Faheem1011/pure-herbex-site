import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized, Contact, Message } from "@/lib/db";

export const dynamic = "force-dynamic";

const accessToken =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1098694096667377";

function cleanPhoneNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("03") && digits.length === 11) {
    digits = "92" + digits.substring(1);
  } else if (digits.startsWith("00")) {
    digits = digits.substring(2);
  }
  return digits;
}

function parseLeadsInput(input: any): Array<{ name: string; phone: string; city: string }> {
  const result: Array<{ name: string; phone: string; city: string }> = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        const phone = cleanPhoneNumber(item);
        if (phone.length >= 10) {
          result.push({ name: `Lead ${phone.slice(-4)}`, phone, city: "" });
        }
      } else if (item && typeof item === "object") {
        const phone = cleanPhoneNumber(String(item.phone || item.number || ""));
        if (phone.length >= 10) {
          result.push({
            name: String(item.name || `Lead ${phone.slice(-4)}`).trim(),
            phone,
            city: String(item.city || "").trim(),
          });
        }
      }
    }
    return result;
  }

  if (typeof input === "string") {
    const lines = input.split(/[\r\n,;]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check CSV-like format: "Name, Phone, City" or "Phone, Name"
      const parts = trimmed.split(/[\t,]+/);
      if (parts.length >= 2) {
        let phone = "";
        let name = "";
        let city = "";

        if (/\d{9,15}/.test(parts[0])) {
          phone = cleanPhoneNumber(parts[0]);
          name = parts[1]?.trim() || `Lead ${phone.slice(-4)}`;
          city = parts[2]?.trim() || "";
        } else if (/\d{9,15}/.test(parts[1])) {
          name = parts[0]?.trim() || "Lead";
          phone = cleanPhoneNumber(parts[1]);
          city = parts[2]?.trim() || "";
        }

        if (phone.length >= 10) {
          result.push({ name, phone, city });
          continue;
        }
      }

      // Check format: "Name (City) 92300..." or "Name 0300..."
      const matchWithDigits = trimmed.match(/^([^\d]+)?\s*(\d{9,15})\s*(.*)$/);
      if (matchWithDigits) {
        const phone = cleanPhoneNumber(matchWithDigits[2]);
        let name = (matchWithDigits[1] || "").trim() || `Lead ${phone.slice(-4)}`;
        let city = (matchWithDigits[3] || "").trim();

        const parenMatch = name.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (parenMatch) {
          name = parenMatch[1].trim();
          city = city || parenMatch[2].trim();
        }

        if (phone.length >= 10) {
          result.push({ name, phone, city });
          continue;
        }
      }

      // Pure phone string
      const phoneOnly = cleanPhoneNumber(trimmed);
      if (phoneOnly.length >= 10) {
        result.push({ name: `Lead ${phoneOnly.slice(-4)}`, phone: phoneOnly, city: "" });
      }
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const leads = db.campaignContacts || [];

    const pending = leads.filter((c: any) => !c.status || c.status === "pending").length;
    const sent = leads.filter((c: any) => c.status === "sent").length;
    const failed = leads.filter((c: any) => c.status === "failed").length;

    return NextResponse.json({
      success: true,
      status: "active",
      leads,
      pending,
      sent,
      failed,
      total: leads.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const db = await getDb();
    if (!db.campaignContacts) db.campaignContacts = [];

    // 1. CLEAR LEADS
    if (body.clearLeads) {
      db.campaignContacts = [];
      await saveDb(db);
      return NextResponse.json({
        success: true,
        message: "Campaign leads cleared successfully",
        total: 0,
        leads: [],
      });
    }

    // 2. ADD / IMPORT NUMBERS
    if (body.addLeads || body.numbers || body.importLeads || body.leads) {
      const parsed = parseLeadsInput(body.numbers || body.leads || body.input);
      if (parsed.length === 0) {
        return NextResponse.json({ error: "No valid phone numbers found" }, { status: 400 });
      }

      let addedCount = 0;
      for (const item of parsed) {
        const existing = db.campaignContacts.find((c) => c.phone === item.phone);
        if (!existing) {
          const newContact: Contact & { city?: string; status?: string } = {
            name: item.name,
            phone: item.phone,
            messages: [],
            tag: "Promo",
            city: item.city,
            status: "pending",
            unreadCount: 0,
            hasUnread: false,
          };
          db.campaignContacts.push(newContact);
          addedCount++;
        } else {
          // Update city or name if newly provided
          if (item.name && item.name !== `Lead ${item.phone.slice(-4)}`) existing.name = item.name;
          if (item.city) (existing as any).city = item.city;
        }
      }

      await saveDb(db);

      const pending = db.campaignContacts.filter((c: any) => !c.status || c.status === "pending").length;
      return NextResponse.json({
        success: true,
        message: `Successfully added ${addedCount} new numbers (${db.campaignContacts.length} total in Promo list).`,
        addedCount,
        total: db.campaignContacts.length,
        pending,
        leads: db.campaignContacts,
      });
    }

    // 3. BATCH SEND (e.g. 200 MARKETING TEMPLATES IN ONE CLICK)
    if (body.batch) {
      const limit = Math.min(Math.max(Number(body.limit) || 200, 1), 500);
      const templateName = body.templateName || "mushtaq_discount_offer";
      const languageCode = body.languageCode || "en";

      const pendingLeads = db.campaignContacts.filter(
        (c: any) => !c.status || c.status === "pending"
      ).slice(0, limit);

      if (pendingLeads.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          failed: 0,
          skipped: 0,
          remaining: 0,
          message: "No pending leads found in Promo list to send.",
        });
      }

      let sentCount = 0;
      let failedCount = 0;
      let firstError: string | null = null;

      for (const lead of pendingLeads) {
        let isSuccess = false;

        if (accessToken && phoneNumberId) {
          try {
            const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
            const payload: any = {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: lead.phone,
              type: "template",
              template: {
                name: templateName,
                language: { code: languageCode },
              },
            };

            // Optional body variables (name, city)
            if (body.bodyVarCount && body.bodyVarCount > 0) {
              const params: any[] = [];
              if (body.bodyVarCount >= 1) params.push({ type: "text", text: lead.name });
              if (body.bodyVarCount >= 2) params.push({ type: "text", text: (lead as any).city || "" });
              payload.template.components = [{ type: "body", parameters: params }];
            }

            const res = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            const resData = await res.json().catch(() => ({}));
            if (res.ok && resData.messages?.[0]?.id) {
              isSuccess = true;
              (lead as any).status = "sent";
              (lead as any).lastMessageId = resData.messages[0].id;

              // Record outgoing message in contact history
              lead.messages.push({
                id: resData.messages[0].id,
                sender: "me",
                text: `[Template: ${templateName}]`,
                timestamp: Math.floor(Date.now() / 1000),
                status: "sent",
                type: "template",
              });
            } else {
              (lead as any).status = "failed";
              (lead as any).error = resData.error?.message || "Meta API send failed";
              if (!firstError) firstError = (lead as any).error;
            }
          } catch (err: any) {
            (lead as any).status = "failed";
            if (!firstError) firstError = err.message;
          }
        } else {
          // Mock successful send in development if no token
          isSuccess = true;
          (lead as any).status = "sent";
        }

        if (isSuccess) sentCount++;
        else failedCount++;

        // Stagger requests slightly (30ms) to respect Meta throughput
        await new Promise((r) => setTimeout(r, 30));
      }

      await saveDb(db);

      const remaining = db.campaignContacts.filter(
        (c: any) => !c.status || c.status === "pending"
      ).length;

      return NextResponse.json({
        success: true,
        sent: sentCount,
        failed: failedCount,
        skipped: 0,
        firstError,
        remaining,
        template: templateName,
      });
    }

    // 4. SINGLE TEST SEND
    if (body.toPhone) {
      const cleanPhone = cleanPhoneNumber(body.toPhone);
      const templateName = body.templateName || "mushtaq_discount_offer";
      const languageCode = body.languageCode || "en";

      let sendResult: any = { success: true };
      if (accessToken && phoneNumberId) {
        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: languageCode },
            },
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          return NextResponse.json(
            { error: resData.error?.message || "Meta template send failed" },
            { status: 400 }
          );
        }
        sendResult.id = resData.messages?.[0]?.id;
      }

      return NextResponse.json({
        success: true,
        sent: 1,
        phone: cleanPhone,
        template: templateName,
        details: sendResult,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Campaign action failed" }, { status: 500 });
  }
}
