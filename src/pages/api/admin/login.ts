import type { APIRoute } from 'astro';
import { ensureAdminExists, verifyCredentials, generateToken, COOKIE_NAME } from '../../../lib/admin-auth';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        await ensureAdminExists();

        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return new Response(JSON.stringify({ error: 'Username and password are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isValid = await verifyCredentials(username, password);

        if (!isValid) {
            return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = generateToken(username);

        cookies.set(COOKIE_NAME, token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Login error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
