# PURE HERBEX — PRODUCTION CONFIGURATION & COURIER SETUP

**Last Updated & Verified:** August 2026  
**Status:** ✅ Fully Integrated & Production-Ready  
**Active Git Branch:** `main`  
**Live Production URL:** `https://pureherbex.com` / `https://www.pureherbex.com`  

---

## 1. System Architecture & Integration Overview

```mermaid
flowchart TD
    A[Customer Checkout] -->|Auto-Dispatch| B[RUN Couriers Aggregator API]
    B -->|api_vendor: '28|1'| C[Leopards Courier Gateway]
    C -->|Assigns| D[Authoritative Leopards Tracking Number]
    D --> E[Stored in Supabase DB & Local Storage]
    E --> F[Customer Account & Track Order Modal]
    E --> G[Admin Portal & WhatsApp Notification]
```

---

## 2. API Credentials & Integration Specification

### 2.1 RUN Couriers API (Leopards COD Gateway)
- **Aggregator Base URL:** `https://portal.runcourier.com/API`
- **Client Code (`client_code`):** `6943`
- **Auth Key (`auth_key`):** `23d4734f-0c1c-4586-90f6-210c4ec8d2f9`
- **Profile ID (`profile_id`):** `6943`
- **Origin City (`origin`):** `Lahore`
- **Service Type (`service_type`):** `Overnight`
- **API Vendor Gateway (`api_vendor`):** `28|1` *(Routes directly through Leopards Courier Service)*

### 2.2 Supabase Database
- **Supabase URL:** `https://ycxsitqyhhsfcgxifsov.supabase.co`
- **Supabase Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNpdHF5aGhzZmNneGlmc292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDI5MjEsImV4cCI6MjEwMTUxODkyMX0.sYL1Rj_dxzLqVUbjExhT3TwZMof6rFeFLBN36DpkvpM`
- **Project ID:** `ycxsitqyhhsfcgxifsov`

### 2.3 System Administration
- **Admin Direct URL:** `/admin` *(Removed from visible UI for security)*
- **Admin Email:** `admin@pureherbex.com`
- **Admin Password:** `PureHerbex2026!`

---

## 3. Product Catalog & Commercial Policy

| Product Name | SKU / Identifier | Price (PKR) | Original Price | Image Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Koveria Glow Complete Kit** | `koveria-glow-complete-kit` | **Rs. 1,500** | Rs. 1,800 | `/images/glow-kit.png` |
| **Koveria Glow Face Pack** | `koveria-glow-face-pack` | **Rs. 1,399** | Rs. 1,600 | `/images/glow-facepack.png` |
| **Koveria Glow Night Toner** | `koveria-glow-toner` | **Rs. 399** | Rs. 499 | `/images/glow-tonner.png` |
| **Koveria Glow Rose Water** | `pure-rose-water` | **Rs. 170** | Rs. 250 | `/images/glow-rose-water.png` |

> **Nationwide Delivery Charges:** Flat **Rs. 150** across all cities in Pakistan via Leopards Courier Cash On Delivery.

---

## 4. Implemented Modules & Features

### 4.1 Courier Service Layer (`src/services/courier/runCourierService.ts`)
- Implements `createCourierShipment`: Books orders using `api_vendor: "28|1"` (Leopards).
- Implements `trackCourierShipment`: Syncs live parcel status and timeline events from `TrackOrder.php`.
- Implements `cancelCourierShipment`: Cancels booked parcels through `CancelOrder.php`.
- Implements `getCourierApiLogs`: Comprehensive audit trail of all API calls and responses.

### 4.2 Customer Authentication & Wishlist (`src/services/customerAuth.ts`)
- Customer signup & login with email/password.
- Persistent saved address and profile for 1-click checkout.
- Order history with 1-click parcel tracking.
- Interactive wishlist management (Heart icons on product cards).

### 4.3 Navigation & Branding
- **Header:** Authentic uploaded logo (`/images/brand_logo.png`) paired with `KOVERIAGLOW by Pure Herbex` typography.
- **Security:** Admin access button removed from user-facing Header & Footer; direct route at `/admin`.
- **Customer Modal:** Quick access button in Header (`Account / Login`) opening [`CustomerAccountModal.tsx`](file:///c:/Users/Lenovo/Desktop/Pure%20Herbex/PUREHERBEX-KOVERIA-main/src/components/CustomerAccountModal.tsx).

---

## 5. Completed Verification Checklist

- [x] All 3 products + 1 complete kit configured with authentic images in `public/images/`.
- [x] Kit pricing set to Rs. 1,500 (Discounted from Rs. 1,800) and delivery set to flat Rs. 150.
- [x] User brand logo integrated with authentic emblem image + typography.
- [x] Admin button completely removed from user-facing Header and Footer.
- [x] Customer registration, login, saved delivery address, and wishlist functional.
- [x] RUN Courier API credentials set (`client_code: 6943`, `auth_key: 23d4734f-0c1c-4586-90f6-210c4ec8d2f9`).
- [x] Leopards Gateway `api_vendor: "28|1"` enforced in courier dispatch service.
- [x] Live parcel tracking modal connected with Leopards Tracking Number lookup.
- [x] Admin portal Courier tab active with credential management and live shipment sync.
- [x] `npm run build` compiled with 0 errors.
- [x] Git branch `main` updated and pushed to `https://github.com/Faheem1011/pure-herbex-site.git`.
