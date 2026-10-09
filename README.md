# Mushtaq - WhatsApp Business API & CRM Suite

This workspace contains the complete production codebase and integration suite for **Mushtaq Ultra Force** and the **Meta WhatsApp Business Cloud API**.

---

## 📁 What Has Been Set Up Here

### 1. 📬 Next.js 15 Full-Stack WhatsApp CRM Dashboard & Webhooks
- **Dashboard URL**: `http://localhost:3000/inbox` (or `https://your-vercel-domain.vercel.app/inbox`)
- **Access Password**: `Mushtaq2026!` (or `PureHerbex2026!`)
- **Frontend File**: [`app/inbox/page.tsx`](file:///c:/Users/Lenovo/Desktop/whatsapp%20api%20for%20mushtaq/app/inbox/page.tsx)
  - Real-time WhatsApp conversation viewer & chat list
  - Custom audio recorder & MP3 voice note player (aligned with WhatsApp Cloud API specs)
  - Attachment sender (images, video, documents, voice notes, location)
  - Message forwarding dialog
  - Contact tagging system (`Confirm`, `Potential`, `Important`, `Spam`)
  - Double tick read/delivery receipt badges
  - Mobile responsive layout with Android back-bridge integration

### 2. 🔌 API Endpoints
- **Webhook**: [`app/api/webhook/route.ts`](file:///c:/Users/Lenovo/Desktop/whatsapp%20api%20for%20mushtaq/app/api/webhook/route.ts)
  - **GET**: Meta verification handshake (`hub.verify_token`, `hub.challenge`)
  - **POST**: Real-time incoming WhatsApp messages (`text`, `image`, `audio`, `voice`, `video`, `document`, `location`) & status receipts (`sent`, `delivered`, `read`)
- **Messages**: [`app/api/messages/route.ts`](file:///c:/Users/Lenovo/Desktop/whatsapp%20api%20for%20mushtaq/app/api/messages/route.ts)
  - Outbound Meta Graph API v20.0 dispatcher
  - Contact list & history retrieval from Upstash Redis KV
  - Conversation archive, deletion, and mark-as-read
- **Media**: [`app/api/media/route.ts`](file:///c:/Users/Lenovo/Desktop/whatsapp%20api%20for%20mushtaq/app/api/media/route.ts)
  - Secure media upload to Meta endpoints and authenticated binary media proxy
- **Tags**: [`app/api/tags/route.ts`](file:///c:/Users/Lenovo/Desktop/whatsapp%20api%20for%20mushtaq/app/api/tags/route.ts)
  - Persists custom customer segmentation tags in Redis

### 3. 🔑 Environment Configuration (`.env` & `.env.local`)
- **Upstash Redis KV**: Active and configured for message persistence
- **WhatsApp Verify Token**: `mushtaq_secret_token` (also accepts `pure_herbex_secret_token`)
- **WhatsApp Phone Number ID**: `1098694096667377`
- **Meta Graph API Version**: `v20.0`

---

## 🏃 How to Run Locally

1. **Start the Next.js Server**:
   ```powershell
   npm run dev
   ```
2. **Access the WhatsApp Inbox CRM**:
   Open [http://localhost:3000/inbox](http://localhost:3000/inbox) in your browser and enter password:
   ```text
   Mushtaq2026!
   ```
