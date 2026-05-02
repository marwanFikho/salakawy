import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { verifyToken, COOKIE_NAME } from '../../../lib/admin-auth';

// Record a pageview (public — called from the tracking script)
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { page_url, referrer, device_type, session_id } = body;

        if (!page_url) {
            return new Response(JSON.stringify({ error: 'page_url required' }), { status: 400 });
        }

        await supabaseAdmin.from('analytics_pageviews').insert({
            page_url,
            referrer: referrer || null,
            device_type: device_type || 'desktop',
            session_id: session_id || null,
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        console.error('Track error:', err);
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};

// Update duration for a session (called on page unload)
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { session_id, duration_seconds } = body;

        if (!session_id) {
            return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 });
        }

        await supabaseAdmin
            .from('analytics_pageviews')
            .update({ duration_seconds })
            .eq('session_id', session_id);

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};
