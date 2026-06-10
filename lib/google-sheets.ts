import crypto from "crypto";
import { ordersToSheetValues } from "@/lib/export-orders";
import type { CrmOrder } from "@/lib/crm-types";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON on Vercel."
    );
  }

  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON.");
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Service account JSON must include client_email and private_key.");
  }

  return parsed;
}

function getSpreadsheetId(): string {
  const id =
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEETS_ID ||
    "";
  if (!id) {
    throw new Error(
      "Set GOOGLE_SHEETS_SPREADSHEET_ID to your Google Sheet document ID."
    );
  }
  return id;
}

function getSheetRange(): string {
  const tab = process.env.GOOGLE_SHEETS_TAB || "Orders";
  return `${tab}!A1`;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const segments = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(payload)),
  ];
  const signingInput = segments.join(".");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(account.private_key.replace(/\\n/g, "\n"), "base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google auth failed");
  }
  return data.access_token as string;
}

async function ensureSheetTab(
  spreadsheetId: string,
  token: string,
  tabName: string
): Promise<void> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ||
        "Could not open spreadsheet. Share it with the service account email."
    );
  }

  const meta = (await metaRes.json()) as {
    sheets?: Array<{ properties?: { title?: string } }>;
  };
  const exists = meta.sheets?.some((s) => s.properties?.title === tabName);
  if (exists) return;

  const addRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: tabName } } }],
      }),
    }
  );

  if (!addRes.ok) {
    const err = await addRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ||
        `Could not create sheet tab "${tabName}"`
    );
  }
}

export function getGoogleSheetUrl(): string | null {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_ID;
  if (!id) return null;
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export async function syncOrdersToGoogleSheet(orders: CrmOrder[]): Promise<{
  rowCount: number;
  sheetUrl: string;
  tab: string;
}> {
  const account = getServiceAccount();
  const spreadsheetId = getSpreadsheetId();
  const tab = process.env.GOOGLE_SHEETS_TAB || "Orders";
  const range = getSheetRange();
  const token = await getAccessToken(account);

  await ensureSheetTab(spreadsheetId, token, tab);

  const values = ordersToSheetValues(orders);

  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${tab}!A:Z`
    )}:clear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  if (!clearRes.ok) {
    const err = await clearRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message || "Failed to clear sheet"
    );
  }

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message || "Failed to write orders to sheet"
    );
  }

  const sheetUrl = getGoogleSheetUrl() || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    rowCount: orders.length,
    sheetUrl,
    tab,
  };
}

export function isGoogleSheetsConfigured(): boolean {
  return !!(
    (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_ID) &&
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );
}
