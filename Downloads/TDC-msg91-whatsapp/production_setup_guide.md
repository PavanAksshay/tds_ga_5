# Production Setup & Integration Guide

This guide outlines the step-by-step procedure to migrate and configure **The Developer Community (TDC)** application using a company-owned **Supabase Database** and a new **GitHub Organization App** (bot).

---

## 1. Database Patch Setup (Supabase)

Your company's current database schema is missing the new GitHub integration columns in the `profiles` table and the entire `user_contributions` table. 

To patch the company database, run the following SQL statements in the **Supabase SQL Editor**:

```sql
-- 1. Add missing GitHub columns to the existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS github_id text,
ADD COLUMN IF NOT EXISTS github_access_token text;

-- 2. Create the user_contributions table
CREATE TABLE IF NOT EXISTS public.user_contributions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id text REFERENCES public.projects(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    link text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Set table owner
ALTER TABLE public.user_contributions OWNER TO postgres;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_contributions_user ON public.user_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contributions_project ON public.user_contributions(project_id);

-- 5. Enable Row Level Security (RLS) on the new table
ALTER TABLE public.user_contributions ENABLE ROW LEVEL SECURITY;

-- 6. Define Access Policies for user_contributions (Drop first if exists to prevent conflicts)
DROP POLICY IF EXISTS "Public read user contributions" ON public.user_contributions;
CREATE POLICY "Public read user contributions" ON public.user_contributions 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own contributions" ON public.user_contributions;
CREATE POLICY "Users can insert own contributions" ON public.user_contributions 
    FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete own contributions" ON public.user_contributions;
CREATE POLICY "Users can delete own contributions" ON public.user_contributions 
    FOR DELETE TO authenticated USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins have full access on user_contributions" ON public.user_contributions;
CREATE POLICY "Admins have full access on user_contributions" ON public.user_contributions 
    TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. Grant Permissions to all user roles
GRANT ALL ON TABLE public.user_contributions TO anon, authenticated, service_role;
```

---

## 2. GitHub App Setup (Organization Bot & OAuth)

A **GitHub App** is the modern, recommended approach to handle both **User OAuth (Log in with GitHub)** and **Repository Webhooks** for contribution tracking.

### A. Creating the App
1. Go to your **GitHub Organization page** -> **Settings** -> **Developer settings** -> **GitHub Apps**.
2. Click **New GitHub App**.
3. Fill in the basic info:
   * **GitHub App name**: `TDC Bot` (or your preferred name)
   * **Homepage URL**: `https://www.thedevcommunity.in`
   * **Callback URL**: `https://www.thedevcommunity.in/auth/github/callback` (used for user authorization/login)
   * **Setup URL**: (Leave blank)
   * **Redirect on active**: Checked

### B. Configuring Webhooks
1. In the **Webhook** section:
   * **Active**: Checked
   * **Webhook URL**: `https://www.thedevcommunity.in/api/github-webhook`
   * **Webhook Secret**: Generate a random secure string (e.g. 32-character hex). Save this to enter in your environment variables as `GITHUB_WEBHOOK_SECRET`.

### C. Permissions (Scope of Access)
Under **Permissions & events**, configure the following:

| Category | Permission Type | Setting | Reason |
|---|---|---|---|
| **Repository permissions** | Metadata | **Read-only** | Required for all repository integrations |
| **Repository permissions** | Contents | **Read-only** | Required to read commit metadata & SHAs from push events |
| **Repository permissions** | Webhooks | **Read & write** | (Optional) Allows the app to auto-configure webhooks |
| **Organization permissions** | Members | **Read-only** | Allows verifying if a user belongs to the GitHub Org |

### D. Subscribed Events
Scroll down to the **Subscribe to events** section and select:
* [x] **Push** (This fires webhooks whenever commits are pushed or PRs are merged to repository branches)

### E. Installation & Key Generation
1. Click **Create GitHub App**.
2. **Client ID & Secret**:
   * Note down the **Client ID** displayed on the App's general settings page.
   * Click **Generate a new client secret** and copy it immediately (it will not be shown again).
3. **Private Key**:
   * Scroll down to the **Private keys** section and click **Generate a private key**.
   * A `.pem` file will download to your computer. Keep this file secure; its content will be used as `GITHUB_APP_PRIVATE_KEY`.
4. **Install the App**:
   * Click **Install App** on the left menu.
   * Select your Organization and install the app on **All repositories** (or select specific ones you want to track).

---

## 3. Environment Variables Configuration

Enter these keys into your production platform hosting panel (e.g., Cloudflare Pages, Dazl console, Vercel) and local `.env` / `.dev.vars` files.

### Supabase Keys
* **`SUPABASE_PROJECT_URL`**: Your Supabase project URL (found in project settings -> API).
* **`SUPABASE_ANON_KEY`**: Your Supabase public anonymous API key (used for client-side queries).
* **`SUPABASE_SERVICE_ROLE_KEY`**: Your Supabase service role secret API key.
  > [!CAUTION]
  > Never expose this key in client-side code. It bypasses RLS policies and is used strictly server-side in loaders, actions, and webhooks to record user data.

### GitHub App Keys
* **`GITHUB_APP_ID`**: The App ID of the GitHub App you created.
* **`GITHUB_CLIENT_ID`**: The OAuth Client ID of the GitHub App.
* **`GITHUB_CLIENT_SECRET`**: The Client Secret of the GitHub App.
* **`GITHUB_WEBHOOK_SECRET`**: The Webhook Secret token you defined in GitHub Settings.
* **`GITHUB_APP_PRIVATE_KEY`**: The complete text content of the downloaded `.pem` private key file.
  > [vanity placeholder tag to check wrapping]
  > [!IMPORTANT]
  > In environment files, wrap the multi-line PEM key in double quotes and replace physical newlines with `\n` to prevent parsing breaks:
  > `"-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"`

---

## 4. Verification Workflow

Once the steps above are complete, the Team Lead can verify the setup:

1. **User Authentication**:
   * Log in to the application.
   * Go to `/connect-github` and authenticate. The database `profiles` table should successfully update with the user's `github_id`, `github_handle`, and `github_access_token`.
2. **Webhook Sync**:
   * Push a commit or merge a Pull Request in any repository where the GitHub App is installed.
   * Inspect the `user_contributions` table in Supabase. You should see new entries created.
   * The entry `user_id` should correctly attribute to the developer who committed the code (by matching their ID or email case-insensitively), even if the merge was done by a Lead.
3. **Profile Terminal**:
   * Visit `/profile`, open the terminal, and verify that the contributions list renders the commits in real time. Hovering/clicking should expand the rows cleanly.
