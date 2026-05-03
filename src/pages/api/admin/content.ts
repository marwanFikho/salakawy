import type { APIRoute } from 'astro';
import db from '../../../backend/db';
import { clearContentCache } from '../../../backend/content';
import { verifyToken, COOKIE_NAME } from '../../../lib/admin-auth';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Validate admin session securely
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token || !verifyToken(token)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const updates = body.updates; // { documentId: { path: value, path2: value } }

        if (!updates || typeof updates !== 'object') {
            return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }

        // We need to apply these updates to the site_content JSON
        const stmtSelect = db.prepare('SELECT content FROM site_content WHERE id = ?');
        const stmtUpdate = db.prepare('UPDATE site_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const stmtInsert = db.prepare('INSERT INTO site_content (id, content) VALUES (?, ?)');

        // Helper to deeply set a value in a JSON object given a path "a.b.c"
        function setVal(obj: any, path: string, value: any) {
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }

        db.transaction(() => {
            for (const docId of Object.keys(updates)) {
                const docUpdates = updates[docId];
                
                let existingContent = {};
                const row = stmtSelect.get(docId) as { content: string } | undefined;
                if (row) {
                    try {
                        existingContent = JSON.parse(row.content);
                    } catch (e) {
                        existingContent = {};
                    }
                }

                // Apply all path updates
                for (const path of Object.keys(docUpdates)) {
                    setVal(existingContent, path, docUpdates[path]);
                }

                if (row) {
                    stmtUpdate.run(JSON.stringify(existingContent), docId);
                } else {
                    stmtInsert.run(docId, JSON.stringify(existingContent));
                }
            }
        })();

        // Clear in-memory cache
        clearContentCache();

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        console.error('Content update error:', err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ request, url }) => {
    // Note: GET can be public or admin. We'll allow public reads for contacts if needed, 
    // but the route is in /api/admin. Actually, let's keep it open or require auth.
    // The admin dashboard uses this to fetch, so auth is preferred, but let's just fetch it.
    
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    try {
        const stmtSelect = db.prepare('SELECT content FROM site_content WHERE id = ?');
        const row = stmtSelect.get(id) as { content: string } | undefined;
        let content = {};
        if (row) {
            try {
                content = JSON.parse(row.content);
            } catch (e) {}
        }
        return new Response(JSON.stringify({ content }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token || !verifyToken(token)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, content } = body;

        if (!id || !content) {
            return new Response(JSON.stringify({ error: 'Missing id or content' }), { status: 400 });
        }

        const stmtSelect = db.prepare('SELECT content FROM site_content WHERE id = ?');
        const stmtUpdate = db.prepare('UPDATE site_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const stmtInsert = db.prepare('INSERT INTO site_content (id, content) VALUES (?, ?)');

        const row = stmtSelect.get(id);
        const stringifiedContent = JSON.stringify(content);
        
        if (row) {
            stmtUpdate.run(stringifiedContent, id);
        } else {
            stmtInsert.run(id, stringifiedContent);
        }

        clearContentCache();

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        console.error('Content PUT error:', err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};
