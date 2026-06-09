import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

export function getInboxPassword(): string {
  const password = process.env.INBOX_PASSWORD;
  if (!password) {
    throw new Error("INBOX_PASSWORD is not configured");
  }
  return password;
}

function safeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function isInboxAuthed(request: NextRequest): boolean {
  try {
    const sessionToken = request.headers.get("Authorization")?.split(" ")[1];
    if (!sessionToken) {
      return false;
    }
    return safeEqualStrings(sessionToken, getInboxPassword());
  } catch {
    return false;
  }
}