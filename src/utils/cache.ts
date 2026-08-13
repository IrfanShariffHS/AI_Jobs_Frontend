/**
 * Cache utility with automatic stale data cleanup
 * Ensures no cached data older than 1 hour is ever used
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
  private cleanupInterval: number | null = null;

  constructor() {
    // Clean up stale data every 5 minutes
    if (typeof window !== 'undefined') {
      this.cleanupInterval = window.setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);

      // Initial cleanup on load
      this.cleanup();
    }
  }

  /**
   * Get cached data if it exists and is not stale
   * Returns null if data doesn't exist or is older than 1 hour
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    
    // Data is stale, delete it and return null
    if (age > this.MAX_AGE_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with current timestamp
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all cache entries matching a pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove all stale entries (older than 1 hour)
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.MAX_AGE_MS) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} stale entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; staleCount: number } {
    let staleCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > this.MAX_AGE_MS) {
        staleCount++;
      }
    }

    return {
      size: this.cache.size,
      staleCount,
    };
  }

  /**
   * Destroy the cache manager and clear interval
   */
  destroy(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

/**
 * Higher-order function to wrap API calls with caching
 * Ensures fresh data is always returned - stale cache is automatically bypassed
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    forceRefresh?: boolean; // Force refresh even if cache is valid
  }
): Promise<T> {
  // If force refresh is requested, skip cache
  if (options?.forceRefresh) {
    cacheManager.delete(key);
    const data = await fetcher();
    cacheManager.set(key, data);
    return data;
  }

  // Try to get from cache
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    console.log(`[Cache] Hit for key: ${key}`);
    return cached;
  }

  // Cache miss or stale - fetch fresh data
  console.log(`[Cache] Miss for key: ${key}`);
  const data = await fetcher();
  cacheManager.set(key, data);
  return data;
}

/**
 * Invalidate cache entries related to specific resources
 */
export function invalidateCache(resource: string): void {
  // Common patterns for cache invalidation
  const patterns: Record<string, string[]> = {
    applications: ['applications', 'dashboard'],
    jobs: ['jobs', 'dashboard'],
    profile: ['profile', 'trending-skills', 'recommendations'],
    recruiters: ['recruiters', 'emails'],
    notifications: ['notifications'],
    dashboard: ['dashboard', 'stats'],
  };

  const resourcePatterns = patterns[resource] || [resource];
  
  for (const pattern of resourcePatterns) {
    cacheManager.deletePattern(pattern);
  }
}

/**
 * Force refresh a specific cache key
 * Useful when you need to ensure fresh data regardless of cache age
 */
export async function forceRefresh<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  cacheManager.delete(key);
  const data = await fetcher();
  cacheManager.set(key, data);
  return data;
}