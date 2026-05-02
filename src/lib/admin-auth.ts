import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = import.meta.env.ADMIN_JWT_SECRET || 'fallback_dev_secret_change_me';
const COOKIE_NAME = 'salakawy_admin_token';
const TOKEN_EXPIRY = '24h';

// Initialize default admin credentials if they don't exist yet
export async function ensureAdminExists() {
    const { data } = await supabaseAdmin
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .single();

    if (!data) {
        // First-time setup: hash the default password and store it
        const defaultPassword = 'password123';
        const hash = await bcrypt.hash(defaultPassword, 12);
        
        await supabaseAdmin.from('admin_settings').upsert([
            { key: 'admin_password_hash', value: hash },
            { key: 'admin_username', value: import.meta.env.ADMIN_USERNAME || 'salakawy' }
        ]);
    }
}

// Verify login credentials
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    const { data: usernameRow } = await supabaseAdmin
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_username')
        .single();

    const { data: passwordRow } = await supabaseAdmin
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .single();

    if (!usernameRow || !passwordRow) return false;
    if (username !== usernameRow.value) return false;

    return bcrypt.compare(password, passwordRow.value);
}

// Generate JWT token
export function generateToken(username: string): string {
    return jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify JWT token
export function verifyToken(token: string): { username: string; role: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    } catch {
        return null;
    }
}

// Check if the current request is authenticated
export function checkAdminAuth(Astro: any): { authenticated: boolean; redirect?: Response } {
    const token = Astro.cookies.get(COOKIE_NAME)?.value;
    
    if (!token) {
        return {
            authenticated: false,
            redirect: Astro.redirect('/admin/login')
        };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        // Invalid/expired token — clear it and redirect
        Astro.cookies.delete(COOKIE_NAME, { path: '/' });
        return {
            authenticated: false,
            redirect: Astro.redirect('/admin/login')
        };
    }

    return { authenticated: true };
}

// Change admin password
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const { data: passwordRow } = await supabaseAdmin
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .single();

    if (!passwordRow) return { success: false, error: 'Admin not found' };

    const isValid = await bcrypt.compare(currentPassword, passwordRow.value);
    if (!isValid) return { success: false, error: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabaseAdmin
        .from('admin_settings')
        .update({ value: newHash, updated_at: new Date().toISOString() })
        .eq('key', 'admin_password_hash');

    return { success: true };
}

export { COOKIE_NAME };
