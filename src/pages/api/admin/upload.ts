import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { verifyToken, COOKIE_NAME } from '../../../lib/admin-auth';

function authCheck(cookies: any) {
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
}

// POST upload a photo
export const POST: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const category = formData.get('category') as string;

        if (!file || !category) {
            return new Response(JSON.stringify({ error: 'file and category required' }), { status: 400 });
        }

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${category}/${timestamp}_${safeName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('photos')
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('photos')
            .getPublicUrl(storagePath);

        // Save metadata to database with draft status
        const { data: dbData, error: dbError } = await supabaseAdmin
            .from('media_uploads')
            .insert({
                filename: file.name,
                storage_path: storagePath,
                public_url: urlData.publicUrl,
                category,
                status: 'draft',
                metadata: { size: file.size, type: file.type }
            })
            .select()
            .single();

        if (dbError) {
            return new Response(JSON.stringify({ error: dbError.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, upload: dbData }), { status: 200 });
    } catch (err) {
        console.error('Upload error:', err);
        return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 });
    }
};

// GET list uploads
export const GET: APIRoute = async ({ cookies, url }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    let query = supabaseAdmin
        .from('media_uploads')
        .select('*')
        .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    return new Response(JSON.stringify(data || []), { status: 200 });
};

// PUT update upload status (publish/unpublish)
export const PUT: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, status: newStatus } = body;

    if (!id || !newStatus) {
        return new Response(JSON.stringify({ error: 'id and status required' }), { status: 400 });
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
        .from('media_uploads')
        .update(updateData)
        .eq('id', id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};

// DELETE remove an upload
export const DELETE: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, storage_path } = body;

    if (!id) {
        return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
    }

    // Delete from storage
    if (storage_path) {
        await supabaseAdmin.storage.from('photos').remove([storage_path]);
    }

    // Delete from database
    await supabaseAdmin.from('media_uploads').delete().eq('id', id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
