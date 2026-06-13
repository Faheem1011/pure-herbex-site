# Google Analytics MCP — Cursor setup

## If sign-in was blocked

Google often blocks **gcloud's default login** (`Access blocked: This app's request is invalid`).
You need your **own Desktop OAuth client** — not the deleted old one.

**Quick fix (run in PowerShell):**

```powershell
. "$env:USERPROFILE\.cursor\scripts\open-ga-oauth-setup.ps1"
# complete steps in browser, download JSON, then:
. "$env:USERPROFILE\.cursor\scripts\finish-ga-mcp-auth.ps1"
```

The finish script uses **manual copy-paste** auth if the browser redirect is blocked.

---

# Fix: OAuth client was deleted (Error 401: deleted_client)

Follow these steps, then run the auth script again.

---

## Step 1 — Open Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in as **Faheem.fiaz1@gmail.com**
3. Create a **new project** (recommended):
   - Name: `pureherbex-analytics`
   - Or pick any project you control

---

## Step 2 — Enable APIs

In your project, enable both:

- [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com)
- [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)

Click **Enable** on each.

---

## Step 3 — OAuth consent screen (if first time)

1. Go to **APIs & Services → OAuth consent screen**
2. User type: **External** (or Internal if Workspace)
3. App name: `Pure Herbex Analytics MCP`
4. User support email: your Gmail
5. Scopes: add `https://www.googleapis.com/auth/analytics.readonly`
6. **Test users:** add `Faheem.fiaz1@gmail.com`
7. Save

---

## Step 4 — Create NEW OAuth client (important)

1. Go to **APIs & Services → Credentials**
2. **+ Create Credentials → OAuth client ID**
3. Application type: **Desktop app** (not Web)
4. Name: `Cursor Analytics MCP`
5. Click **Create**
6. Click **Download JSON** — saves to Downloads as `client_secret_....json`

Do **not** use the old deleted client (`626184853649-...`).

---

## Step 5 — Run auth script

In PowerShell:

```powershell
C:\Users\Lenovo\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe C:\Users\Lenovo\.cursor\scripts\setup-ga-mcp-auth.py "$env:USERPROFILE\Downloads\client_secret_XXXXX.json"
```

Replace `client_secret_XXXXX.json` with your **new** downloaded filename.

Or if it's the only `client_secret*.json` in Downloads:

```powershell
C:\Users\Lenovo\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe C:\Users\Lenovo\.cursor\scripts\setup-ga-mcp-auth.py
```

Browser opens → sign in → allow access.

---

## Step 6 — Update MCP project ID (if new project)

After auth, open `C:\Users\Lenovo\.cursor\mcp.json` and set:

```json
"GOOGLE_CLOUD_PROJECT": "your-new-project-id"
```

The script prints the project ID and saves it to `C:\Users\Lenovo\.cursor\secrets\ga-cloud-project.txt`.

---

## Step 7 — Restart Cursor

1. **Cursor → Settings → MCP**
2. Confirm **analytics-mcp** is enabled and green
3. Ask in chat: *"List my Google Analytics properties"*

---

## Your GA4 property

- Site: https://pureherbex.com
- Measurement ID: `G-SRYQF0G350`
- The Google account must have **Viewer** or higher on this GA4 property

Check access: [Google Analytics](https://analytics.google.com/) → Admin → Property access management.

---

## Official MCP repo

[googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp)
