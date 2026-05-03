import type { APIRoute } from 'astro';
import db from '../../../backend/db';
import { verifyToken, COOKIE_NAME } from '../../../lib/admin-auth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function authCheck(cookies: any) {
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
}

const TRANS_CATEGORIES = ['8-20', '20-30', '30-40', '40-50', '50-70', 'MISC'];

async function convertToJpeg(buffer: Buffer): Promise<Buffer> {
    try {
        return await sharp(buffer)
            .rotate() // auto-rotate based on EXIF
            .jpeg({ quality: 85 })
            .toBuffer();
    } catch (e) {
        console.error('Sharp conversion failed, using original buffer:', e);
        return buffer;
    }
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

        const arrayBuffer = await file.arrayBuffer();
        const rawBuffer = Buffer.from(arrayBuffer);
        
        // Convert to real JPEG (handles HEIF, HEVC, WebP, PNG, etc.)
        const jpegBuffer = await convertToJpeg(rawBuffer);

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '.jpg');
        
        const isTrans = TRANS_CATEGORIES.includes(category);

        if (isTrans) {
            // Filesystem-based for transformations
            const filename = `_draft_${timestamp}_${safeName}`;
            const uploadDir = path.resolve(process.cwd(), `public/all-transformations/${category}`);
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, jpegBuffer);

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            // DB-based for other media
            const filename = `${timestamp}_${safeName}`;
            const relativePath = `/uploads/${category}/${filename}`;
            const uploadDir = path.resolve(process.cwd(), `public/uploads/${category}`);
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, jpegBuffer);

            const id = uuidv4();
            const stmt = db.prepare(`
                INSERT INTO media_uploads (id, filename, storage_path, public_url, category, status, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(id, file.name, relativePath, relativePath, category, 'draft', JSON.stringify({ size: file.size, type: file.type }));
            
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
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

    const category = url.searchParams.get('category') || '';
    const isTrans = TRANS_CATEGORIES.includes(category);

    if (isTrans) {
        // Filesystem-based
        const dirPath = path.resolve(process.cwd(), `public/all-transformations/${category}`);
        if (!fs.existsSync(dirPath)) return new Response(JSON.stringify([]), { status: 200 });

        const files = fs.readdirSync(dirPath).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
        const data = files.map(file => {
            const isDraft = file.startsWith('_draft_');
            return {
                id: file,
                storage_path: `public/all-transformations/${category}/${file}`,
                public_url: `/api/media/all-transformations/${category}/${file}`,
                category: category,
                status: isDraft ? 'draft' : 'published',
                created_at: fs.statSync(path.join(dirPath, file)).mtime.toISOString()
            };
        });
        
        // Sort newest first
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return new Response(JSON.stringify(data), { status: 200 });
    } else {
        // DB-based
        const data = db.prepare('SELECT * FROM media_uploads WHERE category = ? ORDER BY created_at DESC').all(category);
        return new Response(JSON.stringify(data || []), { status: 200 });
    }
};

// PUT update upload status (publish/unpublish)
export const PUT: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, status: newStatus, category } = body;

    const isTrans = TRANS_CATEGORIES.includes(category);

    try {
        if (isTrans) {
            // Filesystem rename
            const oldFile = id;
            let newFile = oldFile;
            if (newStatus === 'published' && oldFile.startsWith('_draft_')) {
                newFile = oldFile.replace('_draft_', '');
            } else if (newStatus === 'draft' && !oldFile.startsWith('_draft_')) {
                newFile = `_draft_${oldFile}`;
            }

            if (oldFile !== newFile) {
                const oldPath = path.resolve(process.cwd(), `public/all-transformations/${category}/${oldFile}`);
                const newPath = path.resolve(process.cwd(), `public/all-transformations/${category}/${newFile}`);
                if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
            }
        } else {
            // DB update
            let stmt;
            if (newStatus === 'published') {
                stmt = db.prepare("UPDATE media_uploads SET status = ?, published_at = CURRENT_TIMESTAMP WHERE id = ?");
            } else {
                stmt = db.prepare("UPDATE media_uploads SET status = ? WHERE id = ?");
            }
            stmt.run(newStatus, id);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

// DELETE remove an upload
export const DELETE: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, storage_path, category } = body;
    const isTrans = TRANS_CATEGORIES.includes(category);

    try {
        if (isTrans) {
            const filePath = path.resolve(process.cwd(), `public/all-transformations/${category}/${id}`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } else {
            if (storage_path) {
                const cleanPath = storage_path.startsWith('/') ? storage_path.slice(1) : storage_path;
                const filePath = path.resolve(process.cwd(), 'public', cleanPath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            db.prepare('DELETE FROM media_uploads WHERE id = ?').run(id);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
