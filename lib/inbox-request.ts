import type { NextRequest } from "next/server";
import { parseInboxLine, type InboxLine } from "@/lib/inbox-line";

export function resolveInboxLine(
  request: NextRequest,
  body?: { line?: string } | null
): InboxLine {
  const fromQuery = new URL(request.url).searchParams.get("line");
  if (fromQuery) return parseInboxLine(fromQuery);
  if (body?.line) return parseInboxLine(body.line);
  return "main";
}
