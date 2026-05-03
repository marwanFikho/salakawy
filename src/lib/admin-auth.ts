import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../backend/db';

const JWT_SECRET = import.meta.env.ADMIN_JWT_SECRET || 'fallback_dev_secret_change_me';
const COOKIE_NAME = 'salakawy_admin_token';
const TOKEN_EXPIRY = '24h';

// Initialize default admin credentials if they don't exist yet
export async function ensureAdminExists() {
    const data = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;

    if (!data) {
        // First-time setup: hash the default password and store it
        const defaultPassword = 'password123';
        const hash = await bcrypt.hash(defaultPassword, 12);
        
        const stmt = db.prepare(`
            INSERT INTO admin_settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
        `);
        
        stmt.run('admin_password_hash', hash);
        stmt.run('admin_username', import.meta.env.ADMIN_USERNAME || 'salakawy');
    }
}

// Verify login credentials
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    const usernameRow = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get('admin_username') as { value: string } | undefined;
    const passwordRow = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;

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
    const passwordRow = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get('admin_password_hash') as { value: string } | undefined;

    if (!passwordRow) return { success: false, error: 'Admin not found' };

    const isValid = await bcrypt.compare(currentPassword, passwordRow.value);
    if (!isValid) return { success: false, error: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE admin_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(newHash, 'admin_password_hash');

    return { success: true };
}

export { COOKIE_NAME };
