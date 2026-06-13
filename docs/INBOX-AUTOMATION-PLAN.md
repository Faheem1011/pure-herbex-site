# Pure Herbex — Inbox Automation System (Complete Plan)

**Status:** Planning only — not implemented yet  
**Last updated:** June 2026  
**Stack:** Vercel (`pure-herbex-site.vercel.app`), WhatsApp Cloud API, Vercel KV  
**Scope:** Vercel inbox only — Hostinger is out of scope  

---

## 1. Executive summary

Pure Herbex agents manually send pre-recorded **voices**, **images**, and **text** depending on customer timing and responses. This document defines a full **Inbox Automation System** that:

- Reacts to **incoming messages** (text, voice, keywords, first contact)
- Runs **timed sequences** (delays, follow-ups, business hours)
- Uses a reusable **asset library** for pre-recorded content
- Stays **connected to inbox** by phone number but **separate** from chat storage (same pattern as Orders CRM)
- Keeps the **agent in control** (global on/off, per-chat pause, suggest vs auto modes)

Implementation is deferred. Build in phases starting with Phase 1 (Welcome + Keywords + Voice backup).

---

## 2. Business goals

| Goal | How automation helps |
|------|----------------------|
| Instant professional reply | Welcome voice + product image within seconds of first message |
| Consistent scripts | Same price/delivery voices every time — no forgetting |
| Night / busy coverage | Queue or send after-hours ack; morning welcome |
| Voice note customers | Auto-ack when customer sends voice and agent is slow |
| Scale without spam | Caps, pause rules, human takeover |
| Tie to sales flow | Keyword → tag Confirm → CRM order (existing CRM) |

---

## 3. WhatsApp Cloud API constraints (non-negotiable)

| Rule | Impact on automation |
|------|----------------------|
| **24-hour service window** | Free-form text, voice, image, video only if customer messaged within last 24h |
| **Outside 24h** | Only **approved templates** (e.g. `herbex_marketing`) — fixed content |
| **No native Status/Stories API** | Cannot auto-post WhatsApp Status; web status page is separate |
| **Incoming voice** | API delivers audio file; automation can trigger on **“voice received”**, not on spoken words unless AI transcription is added (Phase 3) |
| **Media IDs expire** | Meta upload IDs ~30 days — asset library must refresh |
| **Webhook-driven** | All incoming events already hit `/api/webhook/` → extend after save |

**Design rule:** Automate heavily **inside the 24h window**; use **templates** for cold re-engagement.

---

## 4. Current system (what exists today)

### 4.1 Inbox & webhook

| Piece | Location | Role |
|-------|----------|------|
| Webhook | `app/api/webhook/route.ts` | Receives Meta events |
| Message processing | `lib/webhook-process.ts` | Saves to main or campaign inbox in KV |
| Message parsing | `lib/parse-webhook-message.ts` | Text, voice, image, system messages |
| Send API | `app/api/messages/route.ts` | Outbound text/media/voice |
| Media upload | `app/api/media/route.ts` | Upload to Meta, proxy download |
| Inbox UI | `app/inbox/page.tsx` | Chats, tags, voice labels, CRM bridge |

### 4.2 Related systems (already built)

| System | Purpose | KV prefix |
|--------|---------|-----------|
| Main inbox | Customer chats | `whatsapp:contact:{phone}` |
| Campaign inbox | Promo template replies | `whatsapp:marketing_contact:{phone}` |
| Orders CRM | Parcel tracking | `crm:order:{id}`, `crm:phone:{phone}` |
| Status (web) | 24h public status page | `status:file:*`, `whatsapp:status_items` |
| Promo | `herbex_marketing` template | `app/api/campaign/` |

### 4.3 Gaps automation will fill

- No rule engine on webhook after message save
- No delayed job queue (need Cron + KV pending steps)
- No central catalog for pre-recorded voices/images
- No keyword routing
- No per-contact automation state
- Voice labels (`agentNote`) are manual only — automation would use separate asset labels

---

## 5. Architecture overview

```
Customer WhatsApp message
        ↓
Meta Webhook → /api/webhook/
        ↓
processIncomingWebhookMessage()  [existing]
        ↓
Save to inbox KV                  [existing]
        ↓
NEW: runAutomationEngine(phone, event)
        ├─ Load automation:state:{phone}
        ├─ Load active flows from automation:flows
        ├─ Match triggers
        ├─ Enqueue delayed steps OR send immediately
        └─ Log action (visible in inbox as agent-side note)

Vercel Cron (every 1 min)
        ↓
Process automation:pending where runAt <= now
        ↓
Send via /api/messages logic (server-side)
```

### 5.1 Separation of concerns

| Layer | Stores | Does not store |
|-------|--------|----------------|
| **Inbox** | Messages, tags, read state | Flow definitions |
| **Automation** | Flows, assets, per-phone state, pending queue | Full chat history |
| **CRM** | Orders, address, tracking | Message content |
| **Link** | Phone number (+ optional tag / CRM stage) | — |

---

## 6. Data model (Vercel KV)

### 6.1 Asset library

```typescript
type AutomationAsset = {
  id: string;                    // e.g. asset_welcome_voice_001
  label: string;                 // "Welcome — Urdu"
  type: "voice" | "image" | "video" | "text";
  category: "welcome" | "pricing" | "delivery" | "objection" | "closing" | "post_order" | "other";
  language?: "ur" | "en" | "mixed";
  // For media:
  metaMediaId?: string;          // refreshed before expiry
  metaMediaUploadedAt?: number;
  localFileName?: string;        // reference only
  // For text:
  textBody?: string;             // supports {name}, {city}
  durationSec?: number;          // voice/video
  createdAt: number;
  updatedAt: number;
};
```

**KV keys:**

| Key | Content |
|-----|---------|
| `automation:assets` | Set of asset IDs |
| `automation:asset:{id}` | Full asset record |
| `automation:assets:by_category:{cat}` | Optional index |

**Note:** Prefer storing files in `public/automation/` or Vercel Blob later; upload to Meta on send or on schedule.

### 6.2 Flow definition

```typescript
type AutomationFlow = {
  id: string;
  name: string;                  // "Welcome pack"
  enabled: boolean;
  scope: "main" | "campaign" | "both";
  mode: "auto" | "suggest" | "off";  // default for matching contacts
  triggers: AutomationTrigger[];
  steps: AutomationStep[];
  limits: {
    maxAutoPer24h: number;       // default 3
    businessHoursOnly: boolean;  // 9:00–21:00 PKT
    cooldownMinutes: number;     // min gap between auto sends
  };
  createdAt: number;
  updatedAt: number;
};

type AutomationTrigger =
  | { type: "first_message" }
  | { type: "any_incoming" }
  | { type: "keyword"; words: string[]; match: "any" | "all" }
  | { type: "incoming_voice" }
  | { type: "incoming_image" }
  | { type: "tag_set"; tag: "Confirm" | "Potential" | "Important" }
  | { type: "crm_status"; status: OrderStatus }
  | { type: "idle_customer"; afterMinutes: number }
  | { type: "idle_agent"; afterMinutes: number }
  | { type: "schedule"; cron?: string };  // Phase 2+

type AutomationStep =
  | { type: "wait"; seconds: number }
  | { type: "send_voice"; assetId: string }
  | { type: "send_image"; assetId: string }
  | { type: "send_video"; assetId: string }
  | { type: "send_text"; assetId: string }
  | { type: "send_template"; templateName: string }
  | { type: "tag"; tag: string | null }
  | { type: "crm_create_order" }
  | { type: "notify_agent"; message: string }
  | { type: "stop" };
```

**KV keys:**

| Key | Content |
|-----|---------|
| `automation:flows` | Set of flow IDs |
| `automation:flow:{id}` | Flow definition |

### 6.3 Per-contact state

```typescript
type AutomationContactState = {
  phone: string;
  paused: boolean;
  pausedUntil?: number;
  pausedReason?: "manual" | "agent_replied" | "keyword_stop" | "error";
  activeFlowId?: string;
  stage: "new" | "engaged" | "quoted" | "confirmed" | "closed";
  lastCustomerMessageAt: number;
  lastAgentMessageAt: number;
  lastAutoSentAt: number;
  autoSentCount24h: number;
  autoWindowStart: number;
  pendingSteps: Array<{
    id: string;
    flowId: string;
    stepIndex: number;
    runAt: number;
    payload: AutomationStep;
  }>;
  history: Array<{
    at: number;
    flowId: string;
    step: string;
    result: "sent" | "skipped" | "failed" | "queued";
    detail?: string;
  }>;
};
```

**KV key:** `automation:state:{phone}`

### 6.4 Global settings

```typescript
type AutomationSettings = {
  globalMode: "auto" | "suggest" | "off";
  businessHours: { start: "09:00"; end: "21:00"; timezone: "Asia/Karachi" };
  defaultMaxAutoPer24h: 3;
  stopKeywords: string[];  // stop, band, unsubscribe, etc.
};
```

**KV key:** `automation:settings`

---

## 7. Triggers (detailed)

### 7.1 First message

- Fires once per phone when first inbound message is stored
- Typical use: welcome voice + product image after short delay

### 7.2 Keyword router

Suggested starter keywords (Urdu + English):

| Intent | Keywords |
|--------|----------|
| Price | price, rate, kitna, cost, qeemat, charges |
| Delivery | delivery, ship, courier, bhej, dispatch |
| Order / buy | order, confirm, book, chahiye, lena |
| Stop | stop, band, unsubscribe, mat bhejo |
| COD | cod, cash, payment |

Match case-insensitive; normalize Roman Urdu.

### 7.3 Incoming voice

- Customer sends voice note → start timer (e.g. 3–5 min)
- If agent sent a message in that window → cancel auto reply
- Else send acknowledgment voice from library

### 7.4 Idle timers

| Timer | Use |
|-------|-----|
| Customer idle 24h | Follow-up voice #1 |
| Customer idle 48h | Follow-up voice #2 or template if outside window |
| Agent idle 15m | “We’ll reply shortly” text |

### 7.5 Tag & CRM hooks

| Event | Action |
|-------|--------|
| Tag → Confirm | Confirmation pack + optional `create_crm_order` |
| CRM → Shipped | Tracking message (extend existing notify-tracking) |
| CRM → Delivered | Thank-you voice |

### 7.6 Business hours

- Outside 9am–9pm PKT: queue non-urgent steps to next window
- Optional immediate short text: “Thanks — we reply in the morning”

---

## 8. Actions (detailed)

| Action | Sends via | Notes |
|--------|-----------|-------|
| `send_voice` | Meta audio + `voice: true` | From asset library |
| `send_image` | Meta image | |
| `send_video` | Meta video | Keep under 16 MB |
| `send_text` | Text message | `{name}` from contact profile |
| `send_template` | Campaign API pattern | Cold leads only |
| `wait` | — | Stored in `pendingSteps`, Cron executes |
| `tag` | Tags API | |
| `crm_create_order` | Orders from-inbox API | |
| `notify_agent` | Browser notification + inbox note | Suggest mode |
| `stop` | — | Pause automation for contact |

**Inbox visibility:** Auto sends appear as normal outbound messages with optional internal flag `automation: true` for UI styling (agent sees small “Auto” badge).

---

## 9. Example flows (ready to implement)

### Flow A — Welcome pack (Phase 1)

```
TRIGGER: first_message
MODE: auto (or suggest first week)

STEPS:
  1. WAIT 45 seconds
  2. SEND voice: asset_welcome
  3. WAIT 90 seconds
  4. SEND image: asset_product
  5. SEND text: asset_welcome_text
     "Assalam o Alaikum {name}! Reply PRICE for rates or send a voice note."
```

### Flow B — Price keywords (Phase 1)

```
TRIGGER: keyword [price, rate, kitna, cost, qeemat]

STEPS:
  1. WAIT 10 seconds
  2. SEND voice: asset_price_reply
  3. SEND image: asset_price_chart
  4. TAG: Potential
```

### Flow C — Voice backup (Phase 1)

```
TRIGGER: incoming_voice

STEPS:
  1. WAIT 5 minutes
  2. IF agent_replied_since_trigger → STOP
  3. ELSE SEND voice: asset_voice_ack
```

### Flow D — 24h follow-up (Phase 2)

```
TRIGGER: idle_customer, afterMinutes: 1440

STEPS:
  1. IF last_auto_within_24h >= 3 → STOP
  2. SEND voice: asset_followup_day1
```

### Flow E — Confirm → CRM (Phase 2)

```
TRIGGER: keyword [order, confirm, book] OR tag_set Confirm

STEPS:
  1. SEND text: asset_order_confirm
  2. TAG: Confirm
  3. CRM_CREATE_ORDER
  4. NOTIFY_AGENT: "New confirmed order — add address in CRM"
```

### Flow F — Post-ship (Phase 2, CRM-linked)

```
TRIGGER: crm_status shipped

STEPS:
  1. SEND text with tracking (reuse notify-tracking logic)
```

---

## 10. UI plan (future)

New sidebar tab: **Automation** (`viewMode: "automation"`)

### 10.1 Screens

1. **Dashboard** — global mode, active flows count, errors last 24h  
2. **Asset library** — upload voice/image, label, category, test send  
3. **Flow list** — enable/disable, duplicate, import/export JSON  
4. **Flow editor** — triggers + ordered steps (Phase 2: visual builder)  
5. **Logs** — recent auto actions per phone  

### 10.2 Inbox integration

| UI element | Behavior |
|------------|----------|
| Chat header | Automation: Auto / Paused toggle |
| Chat list | Robot icon if automation active |
| Outbound bubble | “Auto” badge when `automation: true` |
| Contact menu | “Pause automation 24h” |

---

## 11. API plan (future)

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST/PATCH/DELETE | `/api/automation/flows/` | Flow CRUD |
| GET/POST/DELETE | `/api/automation/assets/` | Asset CRUD + Meta upload |
| GET/PATCH | `/api/automation/settings/` | Global config |
| GET/PATCH | `/api/automation/state/?phone=` | Per-contact pause/resume |
| POST | `/api/automation/test/` | Dry-run flow for a phone |
| GET | `/api/automation/logs/` | Recent executions |

**Internal (not public):**

- `lib/automation-engine.ts` — `onIncomingMessage(phone, event)`, `processPendingSteps()`
- Hook in `lib/webhook-process.ts` after successful save
- Vercel Cron → `app/api/cron/automation/route.ts` every 1 minute

---

## 12. Safeguards

| Risk | Mitigation |
|------|------------|
| Double reply (human + bot) | Pause automation 30 min when agent opens chat or sends message |
| Spam | `maxAutoPer24h` (default 3), cooldown between sends |
| Wrong script | Suggest mode: push notification “Send welcome voice?” Yes/No |
| STOP requests | `stopKeywords` → pause permanently until manual resume |
| Media expired | Refresh Meta mediaId if older than 25 days before send |
| Outside 24h window | Skip free-form send; log + optional template queue |
| Campaign vs main | `scope` on flows; separate defaults |
| Errors | Log to `history`; notify agent; do not retry infinitely |

---

## 13. Phased implementation roadmap

### Phase 1 — MVP (~2 dev sessions)

- [ ] `lib/automation-engine.ts` (minimal)
- [ ] Asset library API + 5–10 assets uploaded
- [ ] Hardcoded or JSON flows: Welcome, Price keywords, Voice backup
- [ ] Webhook hook after incoming message
- [ ] Cron pending step processor
- [ ] Global on/off + per-chat pause
- [ ] Auto messages in inbox with badge

**Exit criteria:** New lead gets welcome voice + image; “price” gets price voice without agent action.

### Phase 2 — Productivity (~2–3 sessions)

- [ ] Visual flow editor in inbox UI
- [ ] Suggest mode with approve button
- [ ] Business hours queue
- [ ] Tag + CRM triggers
- [ ] Idle follow-up timers
- [ ] Flow import/export

### Phase 3 — Intelligence

- [ ] Gemini voice transcription → keyword router on spoken content
- [ ] Intent detection (ready to buy → Confirm)
- [ ] Analytics per asset (sent / replied / converted)

### Phase 4 — Advanced

- [ ] Template fallback outside 24h
- [ ] Multi-language flow branches
- [ ] A/B testing welcome voices
- [ ] Android notification on automation events

---

## 14. Assets to prepare (before build)

| # | Asset | Format | Suggested label |
|---|-------|--------|-----------------|
| 1 | Welcome voice | OGG/MP3 | Welcome — Urdu |
| 2 | Price & delivery voice | OGG/MP3 | Price reply |
| 3 | Voice ack (“we heard you”) | OGG/MP3 | Voice ack |
| 4 | Follow-up day 1 | OGG/MP3 | Follow-up 24h |
| 5 | Thank you / post-delivery | OGG/MP3 | Thank you |
| 6 | Product bottle image | JPG | Product hero |
| 7 | Price / COD image | JPG | Price chart |
| 8 | Welcome text snippet | Text | Welcome SMS |
| 9 | Order confirm text | Text | Order confirm |

Store locally first; upload to **Asset Library** when Phase 1 starts.

---

## 15. Decisions needed (before coding)

| # | Question | Options |
|---|----------|---------|
| 1 | Default mode | Auto / Suggest / Auto only off-hours |
| 2 | First flows | Welcome + Price + Voice backup (recommended) |
| 3 | Campaign inbox | Same flows as main / separate flows |
| 4 | Welcome delay | 30s / 45s / 2 min |
| 5 | Voice backup wait | 3 min / 5 min / 10 min |
| 6 | Max auto per day | 3 (recommended) |
| 7 | Business hours | 9am–9pm PKT |
| 8 | Stop keywords | stop, band, … (user list) |
| 9 | Urdu keyword list | User to provide common phrases |
| 10 | AI transcription | Phase 3 yes/no |

---

## 16. What we will NOT automate

- Hostinger / `pureherbex.com` static site
- WhatsApp Status circle (Meta API limitation)
- Complex negotiation or custom pricing without human approval (unless Phase 3 intent is very confident)
- Sending without inbox log — all actions must appear in chat history
- Unapproved marketing blasts outside templates

---

## 17. Related documentation & code

| Resource | Path |
|----------|------|
| Webhook | `app/api/webhook/route.ts` |
| Message process | `lib/webhook-process.ts` |
| Parse incoming | `lib/parse-webhook-message.ts` |
| Send messages | `app/api/messages/route.ts` |
| Media | `app/api/media/route.ts` |
| Campaign template | `app/api/campaign/route.ts` |
| Orders CRM | `app/inbox/OrdersPanel.tsx`, `lib/crm-orders.ts` |
| Tracking notify | `app/api/orders/notify-tracking/route.ts` |
| Env example | `.env.example` |

---

## 18. Glossary

| Term | Meaning |
|------|---------|
| Service window | 24h after customer’s last message — free-form replies allowed |
| Template | Meta-approved message for cold / outside-window contact |
| Flow | Named automation playbook (triggers + steps) |
| Asset | Pre-recorded voice/image/text in library |
| Suggest mode | Agent approves before send |
| Pending step | Delayed action waiting for Cron |

---

## 19. Revision history

| Date | Change |
|------|--------|
| Jun 2026 | Initial complete plan — planning only, no code |

---

*When ready to implement, start with Phase 1 and this document as the spec. Update this file as decisions are made and phases ship.*
