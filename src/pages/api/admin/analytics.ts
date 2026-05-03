import type { APIRoute } from 'astro';
import db from '../../../backend/db';
import { verifyToken, COOKIE_NAME } from '../../../lib/admin-auth';

function authCheck(cookies: any) {
    const token = cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
}

// GET analytics data
export const GET: APIRoute = async ({ cookies, url }) => {
    if (!authCheck(cookies)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const range = url.searchParams.get('range') || '7d'; // 7d, 30d, all
    
    let fromDate: string;
    const now = new Date();
    
    if (range === '24h') {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    } else if (range === '7d') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === '30d') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
        fromDate = '2020-01-01T00:00:00.000Z'; // all time
    }

    try {
        // Total pageviews
        const countQuery = db.prepare('SELECT count(*) as count FROM analytics_pageviews WHERE created_at >= ?').get(fromDate) as { count: number };
        const totalViews = countQuery.count;

        // Pageviews by page
        const pageviews = db.prepare(`
            SELECT page_url, duration_seconds, device_type, referrer, created_at 
            FROM analytics_pageviews 
            WHERE created_at >= ? 
            ORDER BY created_at DESC 
            LIMIT 5000
        `).all(fromDate) as any[];

        // Aggregate by page
        const pageMap: Record<string, { views: number; totalDuration: number }> = {};
        const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
        const referrerMap: Record<string, number> = {};
        const dailyMap: Record<string, number> = {};

        for (const pv of pageviews || []) {
            // Page breakdown
            if (!pageMap[pv.page_url]) pageMap[pv.page_url] = { views: 0, totalDuration: 0 };
            pageMap[pv.page_url].views++;
            pageMap[pv.page_url].totalDuration += pv.duration_seconds || 0;

            // Device breakdown
            const dt = pv.device_type || 'desktop';
            deviceMap[dt] = (deviceMap[dt] || 0) + 1;

            // Referrer breakdown
            const ref = pv.referrer || 'Direct';
            referrerMap[ref] = (referrerMap[ref] || 0) + 1;

            // Daily breakdown
            const day = pv.created_at.split('T')[0];
            dailyMap[day] = (dailyMap[day] || 0) + 1;
        }

        // Convert page map to sorted arrays
        const pages = Object.entries(pageMap)
            .map(([url, stats]) => ({
                url,
                views: stats.views,
                totalDuration: stats.totalDuration,
                avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0
            }))
            .sort((a, b) => b.views - a.views);

        const topTimeSpentPages = [...pages]
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .slice(0, 3)
            .map(page => ({
                url: page.url,
                totalDuration: Math.round(page.totalDuration),
                avgDuration: page.avgDuration,
                views: page.views
            }));

        // Top referrers
        const referrers = Object.entries(referrerMap)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Daily chart data
        const daily = Object.entries(dailyMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return new Response(JSON.stringify({
            totalViews: totalViews || 0,
            pages,
            topTimeSpentPages,
            devices: deviceMap,
            referrers,
            daily
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
