import { NextRequest } from "next/server";

export function getInboxPassword(): string {
  const password = process.env.INBOX_PASSWORD;
  if (!password) {
    throw new Error("INBOX_PASSWORD is not configured");
  }
  return password;
}

export function isInboxAuthed(request: NextRequest): boolean {
  try {
    const sessionToken = request.headers.get("Authorization")?.split(" ")[1];
    return sessionToken === getInboxPassword();
  } catch {
    return false;
  }
}
