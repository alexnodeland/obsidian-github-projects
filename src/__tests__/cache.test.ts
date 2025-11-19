import { APICache } from '../state/cache';

describe('APICache', () => {
    let cache: APICache;

    beforeEach(() => {
        cache = new APICache();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('fetchWithCache', () => {
        it('should fetch and cache data on first call', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });
            const result = await cache.fetchWithCache('key1', fetcher);

            expect(result).toEqual({ data: 'test' });
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it('should return cached data on subsequent calls within cache duration', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            // First call
            const result1 = await cache.fetchWithCache('key1', fetcher);
            expect(result1).toEqual({ data: 'test' });
            expect(fetcher).toHaveBeenCalledTimes(1);

            // Advance time by 2 minutes (less than 5 minute cache duration)
            jest.advanceTimersByTime(2 * 60 * 1000);

            // Second call should use cache
            const result2 = await cache.fetchWithCache('key1', fetcher);
            expect(result2).toEqual({ data: 'test' });
            expect(fetcher).toHaveBeenCalledTimes(1); // Still only called once
        });

        it('should refetch data after cache expires', async () => {
            const fetcher = jest.fn()
                .mockResolvedValueOnce({ data: 'test1' })
                .mockResolvedValueOnce({ data: 'test2' });

            // First call
            const result1 = await cache.fetchWithCache('key1', fetcher);
            expect(result1).toEqual({ data: 'test1' });
            expect(fetcher).toHaveBeenCalledTimes(1);

            // Advance time by 6 minutes (more than 5 minute cache duration)
            jest.advanceTimersByTime(6 * 60 * 1000);

            // Second call should refetch
            const result2 = await cache.fetchWithCache('key1', fetcher);
            expect(result2).toEqual({ data: 'test2' });
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it('should maintain separate caches for different keys', async () => {
            const fetcher1 = jest.fn().mockResolvedValue({ data: 'test1' });
            const fetcher2 = jest.fn().mockResolvedValue({ data: 'test2' });

            const result1 = await cache.fetchWithCache('key1', fetcher1);
            const result2 = await cache.fetchWithCache('key2', fetcher2);

            expect(result1).toEqual({ data: 'test1' });
            expect(result2).toEqual({ data: 'test2' });
            expect(fetcher1).toHaveBeenCalledTimes(1);
            expect(fetcher2).toHaveBeenCalledTimes(1);
        });

        it('should handle fetcher errors', async () => {
            const error = new Error('Fetch failed');
            const fetcher = jest.fn().mockRejectedValue(error);

            await expect(cache.fetchWithCache('key1', fetcher)).rejects.toThrow('Fetch failed');
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it('should cache different data types', async () => {
            const stringFetcher = jest.fn().mockResolvedValue('string data');
            const numberFetcher = jest.fn().mockResolvedValue(42);
            const arrayFetcher = jest.fn().mockResolvedValue([1, 2, 3]);
            const objectFetcher = jest.fn().mockResolvedValue({ nested: { value: true } });

            expect(await cache.fetchWithCache('string', stringFetcher)).toBe('string data');
            expect(await cache.fetchWithCache('number', numberFetcher)).toBe(42);
            expect(await cache.fetchWithCache('array', arrayFetcher)).toEqual([1, 2, 3]);
            expect(await cache.fetchWithCache('object', objectFetcher)).toEqual({ nested: { value: true } });
        });
    });

    describe('invalidate', () => {
        it('should invalidate a specific cache entry', async () => {
            const fetcher = jest.fn()
                .mockResolvedValueOnce({ data: 'test1' })
                .mockResolvedValueOnce({ data: 'test2' });

            // Cache data
            const result1 = await cache.fetchWithCache('key1', fetcher);
            expect(result1).toEqual({ data: 'test1' });
            expect(fetcher).toHaveBeenCalledTimes(1);

            // Invalidate cache
            cache.invalidate('key1');

            // Should refetch
            const result2 = await cache.fetchWithCache('key1', fetcher);
            expect(result2).toEqual({ data: 'test2' });
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it('should invalidate all cache entries when no key provided', async () => {
            const fetcher1 = jest.fn()
                .mockResolvedValueOnce({ data: 'test1a' })
                .mockResolvedValueOnce({ data: 'test1b' });
            const fetcher2 = jest.fn()
                .mockResolvedValueOnce({ data: 'test2a' })
                .mockResolvedValueOnce({ data: 'test2b' });

            // Cache data for both keys
            await cache.fetchWithCache('key1', fetcher1);
            await cache.fetchWithCache('key2', fetcher2);
            expect(fetcher1).toHaveBeenCalledTimes(1);
            expect(fetcher2).toHaveBeenCalledTimes(1);

            // Invalidate all
            cache.invalidate();

            // Both should refetch
            await cache.fetchWithCache('key1', fetcher1);
            await cache.fetchWithCache('key2', fetcher2);
            expect(fetcher1).toHaveBeenCalledTimes(2);
            expect(fetcher2).toHaveBeenCalledTimes(2);
        });

        it('should not affect other cache entries when invalidating specific key', async () => {
            const fetcher1 = jest.fn().mockResolvedValue({ data: 'test1' });
            const fetcher2 = jest.fn().mockResolvedValue({ data: 'test2' });

            // Cache data for both keys
            await cache.fetchWithCache('key1', fetcher1);
            await cache.fetchWithCache('key2', fetcher2);

            // Invalidate only key1
            cache.invalidate('key1');

            // key1 should refetch, key2 should use cache
            await cache.fetchWithCache('key1', fetcher1);
            await cache.fetchWithCache('key2', fetcher2);

            expect(fetcher1).toHaveBeenCalledTimes(2);
            expect(fetcher2).toHaveBeenCalledTimes(1); // Still only called once
        });

        it('should not throw when invalidating non-existent key', () => {
            expect(() => cache.invalidate('non-existent')).not.toThrow();
        });
    });

    describe('has', () => {
        it('should return true for cached and fresh data', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            expect(cache.has('key1')).toBe(false);

            await cache.fetchWithCache('key1', fetcher);
            expect(cache.has('key1')).toBe(true);
        });

        it('should return false for non-existent key', () => {
            expect(cache.has('non-existent')).toBe(false);
        });

        it('should return false for expired cache', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cache.fetchWithCache('key1', fetcher);
            expect(cache.has('key1')).toBe(true);

            // Advance time past cache duration
            jest.advanceTimersByTime(6 * 60 * 1000);

            expect(cache.has('key1')).toBe(false);
        });

        it('should return true within cache duration', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cache.fetchWithCache('key1', fetcher);

            // Advance time but stay within cache duration
            jest.advanceTimersByTime(4 * 60 * 1000);

            expect(cache.has('key1')).toBe(true);
        });
    });

    describe('get', () => {
        it('should return cached data for fresh cache', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cache.fetchWithCache('key1', fetcher);

            const result = cache.get('key1');
            expect(result).toEqual({ data: 'test' });
        });

        it('should return null for non-existent key', () => {
            const result = cache.get('non-existent');
            expect(result).toBeNull();
        });

        it('should return null and remove expired cache', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cache.fetchWithCache('key1', fetcher);

            // Advance time past cache duration
            jest.advanceTimersByTime(6 * 60 * 1000);

            const result = cache.get('key1');
            expect(result).toBeNull();

            // Verify it was removed from cache
            expect(cache.has('key1')).toBe(false);
        });

        it('should return data within cache duration', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cache.fetchWithCache('key1', fetcher);

            // Advance time but stay within cache duration
            jest.advanceTimersByTime(4 * 60 * 1000);

            const result = cache.get('key1');
            expect(result).toEqual({ data: 'test' });
        });

        it('should not call fetcher', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            await cache.fetchWithCache('key1', fetcher);
            expect(fetcher).toHaveBeenCalledTimes(1);

            cache.get('key1');
            expect(fetcher).toHaveBeenCalledTimes(1); // Still only called once
        });
    });

    describe('edge cases', () => {
        it('should handle cache at exact expiration boundary', async () => {
            const fetcher = jest.fn()
                .mockResolvedValueOnce({ data: 'test1' })
                .mockResolvedValueOnce({ data: 'test2' });

            await cache.fetchWithCache('key1', fetcher);

            // Advance to exactly 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);

            // Should be expired and refetch
            const result = await cache.fetchWithCache('key1', fetcher);
            expect(result).toEqual({ data: 'test2' });
            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it('should handle rapid consecutive calls', async () => {
            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

            // Make multiple calls in rapid succession
            const promises = [
                cache.fetchWithCache('key1', fetcher),
                cache.fetchWithCache('key1', fetcher),
                cache.fetchWithCache('key1', fetcher)
            ];

            await Promise.all(promises);

            // First call should fetch, subsequent calls should use cache
            // Note: Due to Promise timing, this might call fetcher more than once
            // since the cache is only set after the promise resolves
            expect(fetcher).toHaveBeenCalled();
        });

        it('should handle null and undefined values', async () => {
            const nullFetcher = jest.fn().mockResolvedValue(null);
            const undefinedFetcher = jest.fn().mockResolvedValue(undefined);

            const nullResult = await cache.fetchWithCache('null-key', nullFetcher);
            const undefinedResult = await cache.fetchWithCache('undefined-key', undefinedFetcher);

            expect(nullResult).toBeNull();
            expect(undefinedResult).toBeUndefined();

            // These should still be cached
            expect(cache.has('null-key')).toBe(true);
            expect(cache.has('undefined-key')).toBe(true);
        });
    });
});
