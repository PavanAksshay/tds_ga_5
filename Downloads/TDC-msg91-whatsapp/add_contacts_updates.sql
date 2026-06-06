-- Contacts Table
CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text DEFAULT 'NEW'::text NOT NULL,
    internal_notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Updates Table
CREATE TABLE public.updates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Policies for Contacts
-- Anyone can insert (since they might not be authenticated)
CREATE POLICY "Anyone can insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);

-- Only admins can view and edit contacts
CREATE POLICY "Admins can view and edit contacts" ON public.contacts FOR ALL
    USING (
        (auth.jwt() ->> 'email')::text = 'amogh.vk.2005@gmail.com'
    );

-- Policies for Updates
-- Anyone can read published updates
CREATE POLICY "Anyone can read published updates" ON public.updates FOR SELECT
    USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage updates" ON public.updates FOR ALL
    USING (
        (auth.jwt() ->> 'email')::text = 'amogh.vk.2005@gmail.com'
    );
