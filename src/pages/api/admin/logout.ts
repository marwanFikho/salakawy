import type { APIRoute } from 'astro';
import { COOKIE_NAME } from '../../../lib/admin-auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
    cookies.delete(COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax'
    });
    return redirect('/admin/login');
};
