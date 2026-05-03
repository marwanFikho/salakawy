import db from './db';

const cache = new Map<string, any>();

export function getContent(documentId: string) {
    if (cache.has(documentId)) return cache.get(documentId);
    
    const row = db.prepare('SELECT content FROM site_content WHERE id = ?').get(documentId) as { content: string } | undefined;
    if (!row) {
        return {};
    }
    try {
        const data = JSON.parse(row.content);
        cache.set(documentId, data);
        return data;
    } catch (e) {
        return {};
    }
}

export function deepMerge(target: any, source: any): any {
    if (source === undefined) return target;
    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
        return source !== undefined ? source : target;
    }
    
    // If target is an array, we should return an array.
    if (Array.isArray(target)) {
        const result = [...target];
        // source could be an array or an object (like { "0": {...} })
        if (Array.isArray(source)) {
            for (let i = 0; i < source.length; i++) {
                if (source[i] !== undefined) {
                    result[i] = deepMerge(target[i], source[i]);
                }
            }
        } else {
            // source is an object with numerical keys
            for (const key in source) {
                const idx = parseInt(key, 10);
                if (!isNaN(idx)) {
                    result[idx] = deepMerge(target[idx], source[key]);
                }
            }
        }
        return result;
    }
    
    // target is an object
    const result = { ...target };
    for (const key in source) {
        result[key] = deepMerge(target[key], source[key]);
    }
    return result;
}

export function getVal(data: any, path: string, defaultValue: any) {
    const keys = path.split('.');
    let val = data;
    for (const key of keys) {
        if (!val || typeof val !== 'object') {
            val = undefined;
            break;
        }
        val = val[key];
    }
    
    return deepMerge(defaultValue, val);
}

export function clearContentCache() {
    cache.clear();
}
