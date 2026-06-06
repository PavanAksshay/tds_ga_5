# WhatsApp Phone OTP — Production Setup Guide

This guide is for the **business owner / Meta Business Account admin** to take the
WhatsApp phone-OTP verification feature live. The application code is already
complete — production only requires **account setup + configuration**, no code
changes.

---

## 1. What this feature does

- New users **must verify a phone number over WhatsApp** during onboarding before
  they can continue.
- Existing users can verify/change their number from **Profile → WHATSAPP_VERIFICATION**.
- Admins see each member's phone number and verified status in **Admin → Members**.

A 6-digit code is generated server-side, hashed, stored with a 10-minute expiry,
and delivered to the user's WhatsApp. Limits: 30-second resend cooldown, max 5
attempts per code.

---

## 2. How delivery works (important)

There are **two delivery modes** in the code, controlled by the `WHATSAPP_USE_TEXT`
env var:

| Mode | When | How |
|---|---|---|
| **Template** (production) | `WHATSAPP_USE_TEXT` unset/`false` | Sends an approved **authentication template** — works for any user, no prior contact needed. |
| **Text** (testing only) | `WHATSAPP_USE_TEXT=true` | Sends free-form text — only delivers if the user messaged the business in the last 24h. **Do not use in production.** |

**Production must use Template mode.** Free-form text cannot initiate a conversation
with a user who has never messaged you, so it will silently fail for real signups.

---

## 3. Prerequisites (Meta side)

The owner needs:

1. A **Meta Business Portfolio** (business.facebook.com).
2. **Business Verification** completed (Business Settings → Security Center →
   Verify). Required to lift messaging limits and reliably create templates.
3. A **WhatsApp Business Account (WABA)** with a **real phone number** added
   (a number not already on the consumer WhatsApp app, or migrated properly).
4. A **payment method** added to the WABA (Billing). Authentication/utility
   conversations are charged per Meta pricing.
5. **Two-step verification enabled** on the phone number (WhatsApp Manager →
   number → Settings). Meta blocks template creation without it.

---

## 4. Meta WhatsApp Cloud API — production steps

### 4.1 Add and verify a production phone number
1. **WhatsApp Manager** → **Phone numbers** → **Add phone number**.
2. Use a number you own that can receive an SMS/voice verification code.
3. Set the **display name** (subject to Meta review).
4. Enable **two-step verification** for the number.

### 4.2 Add a payment method
- **WhatsApp Manager → Billing → Add payment method.** Without this, sends are
  throttled/blocked.

### 4.3 Create the authentication template
1. **WhatsApp Manager → Message templates → Create template**.
2. **Category:** Authentication
3. **Name:** `otp_verification` (lowercase, underscores)
4. **Language:** English (US) → maps to code `en_US`
5. **Type:** One-time passcode, button: **Copy code**
6. Submit and wait for **Approved** (authentication templates are usually fast).

> The code sends the OTP as the **body parameter** and as the **copy-code URL
> button parameter at index 0** — the standard authentication-template shape, so
> the default Meta authentication template works as-is.

### 4.4 Generate a PERMANENT access token
Temporary tokens from the API Setup page expire in ~24h. For production, create a
**System User token**:
1. **Business Settings → Users → System users → Add** (role: Admin).
2. **Add Assets** → assign the **WhatsApp Account (WABA)** with full control.
3. **Generate new token** → select the app → permissions:
   `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Copy the token and store it as a secret. **Never commit it.**

### 4.5 Get the Phone Number ID
- **WhatsApp Manager / API Setup** → copy the **Phone number ID** of your
  production number (a long numeric ID).

---

## 5. Database migration (Supabase)

Run `add_phone_verification.sql` (in the repo root) in the **Supabase SQL editor**
of the **production** project. It:

- Adds `phone_number`, `phone_verified`, `phone_verified_at` to `profiles`.
- Adds a partial unique index so two accounts can't claim the same **verified** number.
- Creates the `phone_otps` table (one active challenge per user).
- Enables **RLS with no policies** on `phone_otps` — all access is server-side via
  the service-role key only.

---

## 6. Environment variables (production host)

Set these in the hosting platform's env config (e.g. Vercel Project Settings →
Environment Variables). **Do not** put them in committed files.

```
# Supabase (production project)
SUPABASE_PROJECT_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# WhatsApp Cloud API (production)
WHATSAPP_ACCESS_TOKEN=<permanent system-user token>
WHATSAPP_PHONE_NUMBER_ID=<production phone number ID>
WHATSAPP_OTP_TEMPLATE_NAME=otp_verification
WHATSAPP_TEMPLATE_LANG=en_US
# WHATSAPP_GRAPH_VERSION=v21.0   # optional, this is the default

# IMPORTANT: do NOT set WHATSAPP_USE_TEXT in production (leave it unset).

# Optional: stable salt for OTP hashing (defaults to the service-role key).
# PHONE_OTP_SALT=<long random string>
```

Notes:
- Omitting `WHATSAPP_USE_TEXT` (or setting it to `false`) puts the app in
  **template mode** — the correct production behavior.
- The app reads env vars **at boot**; redeploy/restart after any change.

---

## 7. Deploy & verify

1. Apply the SQL migration to the production Supabase project.
2. Set all env vars above.
3. Deploy the app.
4. Sign up with a **real** WhatsApp number (any number — no allow-list in
   production once the WABA is verified).
5. Confirm the OTP arrives via the template and verification completes.
6. Check **Admin → Members** shows the number with a **VERIFIED** badge.

---

## 8. Troubleshooting (Meta error codes)

| Code | Meaning | Fix |
|---|---|---|
| `190` | Auth error / token invalid or expired | Regenerate the **permanent** token; redeploy. |
| `131030` | Recipient not in allowed list | Only happens on the **test** number. Use a **verified production WABA** (no allow-list). |
| `131005` | Access denied / permissions | Token lacks `whatsapp_business_messaging`, or token and Phone Number ID are from different apps/WABAs. |
| `132xxx` | Template not found / param mismatch | Ensure `WHATSAPP_OTP_TEMPLATE_NAME` + `WHATSAPP_TEMPLATE_LANG` exactly match an **Approved** template. |
| `2388185` | Cannot create template | Enable **two-step verification**, complete **business verification**, ensure Admin role, add **payment method**. |
| `131047` | Re-engagement required | Only affects free-form text; not applicable in template mode. |

---

## 9. Security checklist

- `WHATSAPP_ACCESS_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are **secrets** — host
  env only, never in git.
- `phone_otps` has RLS enabled with no policies; only the server (service role)
  can read it.
- OTP codes are stored **hashed** (SHA-256 with a salt), never in plaintext.
- Set a stable `PHONE_OTP_SALT` in production so hashing is independent of key
  rotation.

---

## 10. Summary for the owner

1. Verify the business + add a real WhatsApp number + payment method.
2. Enable two-step verification on the number.
3. Create & get approval for the `otp_verification` authentication template.
4. Generate a permanent system-user access token.
5. Run `add_phone_verification.sql` on production Supabase.
6. Set the env vars (template mode — **no** `WHATSAPP_USE_TEXT`).
7. Deploy and test with a real number.

No application code changes are required — this is configuration only.
