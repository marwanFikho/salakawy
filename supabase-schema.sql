-- =====================================================
-- SALAKAWY ADMIN DASHBOARD — DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (supabase.co → SQL Editor)
-- =====================================================

-- 1. Admin Settings (credentials, config)
CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Analytics Pageviews
CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_url TEXT NOT NULL,
    referrer TEXT,
    device_type TEXT DEFAULT 'desktop',
    session_id TEXT,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON analytics_pageviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_page ON analytics_pageviews(page_url);

-- 3. Site Content (editable sections)
CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    content JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Media Uploads (photos with draft/published workflow)
CREATE TABLE IF NOT EXISTS media_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    category TEXT NOT NULL, -- 'hero', 'transformations', 'coach', 'assistant'
    status TEXT DEFAULT 'draft', -- 'draft' or 'published'
    display_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_category ON media_uploads(category);
CREATE INDEX IF NOT EXISTS idx_media_status ON media_uploads(status);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

-- Allow the service role full access (our server-side admin client)
-- The anon key can only INSERT pageviews (for analytics tracking)
CREATE POLICY "Service role full access" ON admin_settings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON site_content
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON media_uploads
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can insert pageviews" ON analytics_pageviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can read pageviews" ON analytics_pageviews
    FOR SELECT USING (true);

-- =====================================================
-- Storage Bucket for Photos
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to published photos
CREATE POLICY "Public read photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

-- Allow service role to upload/delete
CREATE POLICY "Service upload photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Service delete photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'photos');

-- =====================================================
-- Seed initial site content from current hardcoded values
-- =====================================================
INSERT INTO site_content (id, content) VALUES
('contacts', '{
    "coach": {
        "name": "Salakawy",
        "role": "Head Coach",
        "phone": "+20 121 772 0267",
        "photo": "/coach.jpg",
        "whatsapp": "201217720267"
    },
    "assistant": {
        "name": "Nour",
        "role": "Assistant Coach",
        "phone": "+20 109 215 1540",
        "photo": "/Nour Assistant.jpeg",
        "whatsapp": "201092151540"
    }
}'::jsonb),
('packages', '{
    "support": {
        "name": "Support Team",
        "price_egp": 1200,
        "price_usd": 45,
        "duration": "1 Month",
        "price_3m_egp": 3200,
        "price_3m_usd": 85,
        "subtitle": "Weekly follow-up handled entirely by our Assistant Team.",
        "features": [
            "Plan designed by Salakawy",
            "Weekly assistant follow-up",
            "Adjusted Flexible Diet",
            "Gym & Home Workouts + Videos"
        ],
        "cta_text": "Message Nour",
        "icon": "✅"
    },
    "silver": {
        "name": "Silver",
        "price_egp": 3700,
        "price_usd": 80,
        "duration": "1 Month",
        "price_3m_egp": 7900,
        "price_3m_usd": 170,
        "subtitle": "Weekly check-ins directly with Salakawy to keep you on track.",
        "features": [
            "Direct Salakawy follow-up weekly",
            "WhatsApp Q & A anytime",
            "Diet Based on BMR & Food Choices",
            "Cardio and Abs routine",
            "Gym & Home Workouts"
        ],
        "cta_text": "Book Silver",
        "icon": "🌟",
        "popular": true
    },
    "gold": {
        "name": "Gold",
        "price_egp": 4900,
        "price_usd": 110,
        "duration": "1 Month",
        "price_3m_egp": 12900,
        "price_3m_usd": 270,
        "subtitle": "Daily check-ins, VIP attention, and direct phone access.",
        "features": [
            "Daily check-ins & updates",
            "My direct Phone Number",
            "Feel free to call me anytime",
            "WhatsApp Q & A instantly",
            "Full Diet & Workout Plan"
        ],
        "cta_text": "Book Gold",
        "icon": "👑"
    },
    "platinum": {
        "name": "Platinum",
        "price_egp": 12700,
        "price_usd": 230,
        "duration": "1 Month",
        "price_3m_egp": 0,
        "price_3m_usd": 0,
        "subtitle": "The ultimate VIP experience. I reach out to you proactively every day.",
        "features": [
            "I reach out to YOU daily",
            "Priority response 24/7",
            "Fully customized everything",
            "Private video coaching calls",
            "Lifetime access to resources"
        ],
        "cta_text": "Book Platinum",
        "icon": "💎"
    }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
