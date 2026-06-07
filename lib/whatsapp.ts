export function getWhatsAppAccessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
  }
  return token;
}

export function getWhatsAppPhoneNumberId(): string {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured");
  }
  return phoneNumberId;
}

export function getWhatsAppVerifyToken(): string {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    throw new Error("WHATSAPP_VERIFY_TOKEN is not configured");
  }
  return verifyToken;
}
