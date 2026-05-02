import type { APIRoute } from 'astro';
import { verifyToken, changePassword, COOKIE_NAME } from '../../../lib/admin-auth';

function authCheck(cookies: any) {
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
}

// PUT change password
export const PUT: APIRoute = async ({ request, cookies }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
        return new Response(JSON.stringify({ error: 'Both passwords required' }), { status: 400 });
    }

    if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400 });
    }

    const result = await changePassword(currentPassword, newPassword);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
