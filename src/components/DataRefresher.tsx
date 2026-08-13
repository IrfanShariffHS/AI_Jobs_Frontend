/**
 * Component to ensure fresh data when navigating between sections
 * Automatically invalidates relevant cache and fetches fresh data
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { cacheManager, invalidateCache } from '../utils/cache';

interface DataRefresherProps {
  children: React.ReactNode;
}

export function DataRefresher({ children }: DataRefresherProps) {
  const location = useLocation();

  useEffect(() => {
    // Map routes to cache resources that should be invalidated
    const routeToResourceMap: Record<string, string[]> = {
      '/': ['dashboard', 'stats'],
      '/jobs': ['jobs'],
      '/applications': ['applications'],
      '/automation': ['applications', 'jobs'],
      '/scheduler': ['applications'],
      '/recruiters': ['recruiters'],
      '/analytics': ['dashboard', 'stats'],
      '/profile': ['profile'],
      '/notifications': ['notifications'],
      '/settings': ['profile'],
      '/recruiter-extraction': ['recruiters'],
    };

    const currentPath = location.pathname;
    const resourcesToInvalidate = routeToResourceMap[currentPath];

    if (resourcesToInvalidate) {
      // Invalidate relevant cache when navigating to ensure fresh data
      resourcesToInvalidate.forEach(resource => {
        invalidateCache(resource);
      });
    }

    // Also perform a general cleanup to remove any stale data
    const stats = cacheManager.getStats();
    if (stats.staleCount > 0) {
      console.log(`[DataRefresher] Cleaning up ${stats.staleCount} stale cache entries`);
    }
  }, [location.pathname]);

  return <>{children}</>;
}