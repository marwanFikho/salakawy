import type { APIRoute } from 'astro';
import db from '../../../backend/db';
import { v4 as uuidv4 } from 'uuid';

// Record a pageview (public — called from the tracking script)
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { page_url, referrer, device_type, session_id, duration_seconds } = body;

        // Navigator.sendBeacon always sends POST. If page_url is missing but duration_seconds exists, it's an update.
        if (duration_seconds !== undefined && !page_url) {
            if (!session_id) {
                return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 });
            }
            const updateStmt = db.prepare('UPDATE analytics_pageviews SET duration_seconds = ? WHERE session_id = ?');
            updateStmt.run(duration_seconds, session_id);
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        if (!page_url) {
            return new Response(JSON.stringify({ error: 'page_url required' }), { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO analytics_pageviews (id, page_url, referrer, device_type, session_id) 
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(
            uuidv4(),
            page_url,
            referrer || null,
            device_type || 'desktop',
            session_id || null
        );

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

        const stmt = db.prepare('UPDATE analytics_pageviews SET duration_seconds = ? WHERE session_id = ?');
        stmt.run(duration_seconds, session_id);

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};
