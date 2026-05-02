import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { verifyToken, COOKIE_NAME } from '../../../lib/admin-auth';

function authCheck(cookies: any) {
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
}

// GET site content by ID
export const GET: APIRoute = async ({ cookies, url }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const id = url.searchParams.get('id');

    if (id) {
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 404 });
        }
        return new Response(JSON.stringify(data), { status: 200 });
    }

    // Return all content
    const { data, error } = await supabaseAdmin
        .from('site_content')
        .select('*');

    return new Response(JSON.stringify(data || []), { status: 200 });
};

// PUT update site content
export const PUT: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
        return new Response(JSON.stringify({ error: 'id and content required' }), { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from('site_content')
        .upsert({
            id,
            content,
            updated_at: new Date().toISOString()
        });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
