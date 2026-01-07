
const cache = new Map();    // Simple in-memory cache 

export function getCache(key) {
    const entry = cache.get(key);

    if (!entry) return null;
    console.log("Cache entry found for key:", key, "with expiry at:", new Date(entry.expiry).toISOString());
    if (Date.now() > entry.expiry) {  // Check if cache entry has expired
        cache.delete(key);  // Remove expired entry
        return null;
    }
    return entry.data;  // Return cached data
}

export function setCache(key, data, ttlMs = 60_000) { // Default TTL is 60 seconds
    cache.set(key, {
        data,
        expiry: Date.now() + ttlMs
    });
}