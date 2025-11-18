/**
 * API response caching
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export class APICache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Fetch with caching
     */
    async fetchWithCache<T>(
        key: string,
        fetcher: () => Promise<T>
    ): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(key, { data, timestamp: now });
        return data;
    }

    /**
     * Invalidate a specific cache entry or all entries
     */
    invalidate(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Check if a key is cached and fresh
     */
    has(key: string): boolean {
        const cached = this.cache.get(key);
        if (!cached) return false;

        const now = Date.now();
        return (now - cached.timestamp) < this.CACHE_DURATION;
    }

    /**
     * Get cached data without fetching
     */
    get<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if ((now - cached.timestamp) >= this.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }
}
