# Google OAuth Setup Guide (Supabase)

This guide provides the exact steps to configure your Google and Supabase dashboards to match the clean PKCE implementation now active in the codebase.

## 1. Google Cloud Console Configuration
1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** > **OAuth client ID**.
3. Select **Web application**.
4. **Name**: `TDC - Supabase Prod` (or similar).
5. **Authorized JavaScript origins**: 
   - `https://ivhlsmpxxricfytyswzi.supabase.co`
6. **Authorized redirect URIs**:
   - `https://ivhlsmpxxricfytyswzi.supabase.co/auth/v1/callback`
7. Click **Create** and copy your **Client ID** and **Client Secret**.

## 2. Supabase Dashboard Configuration
### A. Enable Google Provider
1. Go to **Authentication > Providers > Google**.
2. Toggle **Enable Google Provider** to ON.
3. Paste the **Client ID** and **Client Secret** from the previous step.
4. Click **Save**.

### B. Configure Redirect URLs
1. Go to **Authentication > URL Configuration**.
2. **Site URL**: `https://www.thedevcommunity.in`
3. **Additional Redirect URLs**:
   - `http://localhost:5173/**`
   - `https://thedevcommunity.in/**`
   - `https://www.thedevcommunity.in/**`
4. Click **Save**.

## 3. Environment Variables (.env)
Your `.env` currently uses:
```bash
SUPABASE_PROJECT_URL="https://ivhlsmpxxricfytyswzi.supabase.co"
```
Ensure this matches the URLs used in the steps above.

---

## Troubleshooting
- **Loops or production redirects**: If local login still sends you to production, it means `localhost` is either missing from "Additional Redirect URLs" or there is a protocol mismatch.
- **Callback errors**: If you see `AUTH_EXCHANGE_FAILED`, check the terminal logs for the specific Supabase error message.
