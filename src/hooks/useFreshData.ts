/**
 * React hooks for ensuring fresh data and automatic cache invalidation
 * Prevents stale data from being displayed to users
 */

import { useEffect, useRef, useCallback } from 'react';
import { cacheManager, forceRefresh, invalidateCache } from '../utils/cache';

/**
 * Hook to automatically refresh data at specified intervals
 * Ensures data stays fresh during user sessions
 */
export function useAutoRefresh(
  refreshFn: () => Promise<void>,
  options: {
    interval?: number; // Refresh interval in milliseconds (default: 5 minutes)
    enabled?: boolean; // Whether auto-refresh is enabled
    immediate?: boolean; // Whether to refresh immediately on mount
  } = {}
) {
  const {
    interval = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    immediate = true,
  } = options;

  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      await refreshFn();
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, [refreshFn]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      // Immediate refresh if requested
      if (immediate) {
        refresh();
      }

      // Set up interval refresh
      intervalRef.current = window.setInterval(() => {
        refresh();
      }, interval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, immediate, refresh]);

  return { refresh };
}

/**
 * Hook to invalidate cache when component unmounts
 * Useful for temporary views or modals
 */
export function useCacheInvalidationOnUnmount(resources: string[]) {
  useEffect(() => {
    return () => {
      resources.forEach(resource => invalidateCache(resource));
    };
  }, resources);
}

/**
 * Hook to ensure data is fresh when component mounts
 * Forces a refresh regardless of cache age
 */
export function useForceRefreshOnMount<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        if (!cancelled && mountedRef.current) {
          await forceRefresh(key, fetcher);
        }
      } catch (error) {
        console.error(`Force refresh failed for ${key}:`, error);
      }
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
}

/**
 * Hook to monitor cache health and trigger cleanup
 * Logs warnings if stale data is detected
 */
export function useCacheHealthCheck(interval: number = 60000) {
  useEffect(() => {
    const checkInterval = window.setInterval(() => {
      const stats = cacheManager.getStats();
      if (stats.staleCount > 0) {
        console.warn(`[Cache Health] Found ${stats.staleCount} stale entries - cleanup needed`);
      }
    }, interval);

    return () => clearInterval(checkInterval);
  }, [interval]);
}

/**
 * Hook to invalidate specific cache resources when data changes
 * Call this function when you know data has been modified
 */
export function useCacheInvalidator() {
  const invalidate = useCallback((resource: string) => {
    invalidateCache(resource);
  }, []);

  const invalidateMultiple = useCallback((resources: string[]) => {
    resources.forEach(resource => invalidateCache(resource));
  }, []);

  const invalidateAll = useCallback(() => {
    cacheManager.clear();
  }, []);

  return {
    invalidate,
    invalidateMultiple,
    invalidateAll,
  };
}