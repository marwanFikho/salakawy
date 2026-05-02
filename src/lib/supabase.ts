import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

// Server-side client with full access (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Public client (for analytics tracking from the browser)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey };
