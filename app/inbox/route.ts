import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

let cachedHtml: string | null = null;

function getInboxHtml(): string {
  try {
    const filePath = path.join(process.cwd(), "public", "inbox-static", "index.html");
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (err) {
    console.error("Error reading inbox-static/index.html:", err);
  }

  if (cachedHtml) {
    return cachedHtml;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Mushtaq WhatsApp Inbox</title></head><body><p>Loading WhatsApp Inbox...</p></body></html>`;
}

export async function GET(request: NextRequest) {
  const html = getInboxHtml();
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
