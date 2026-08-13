/**
 * Simple test to verify cache functionality
 * This can be run in the browser console to test the cache behavior
 */

// Test helper for manual testing in browser console
// To use: import { testCache } from './utils/cache.test'; testCache();
export async function testCache() {
  // Dynamic import to avoid loading cache module during build
  const { cacheManager, withCache, invalidateCache } = await import('./cache');
  
  console.log('=== Cache Test ===');
  
  // Test 1: Basic cache set/get
  console.log('Test 1: Basic cache set/get');
  cacheManager.set('test-key', { data: 'test-data' });
  const retrieved = cacheManager.get('test-key');
  console.log('Set data, retrieved:', retrieved);
  console.log('✓ Test 1 passed' if retrieved?.data === 'test-data' else '✗ Test 1 failed');
  
  // Test 2: Stale data cleanup (simulating old data)
  console.log('\nTest 2: Stale data cleanup');
  // Manually set an old timestamp
  const oldEntry = {
    data: 'old-data',
    timestamp: Date.now() - (61 * 60 * 1000), // 61 minutes ago
    key: 'old-key'
  };
  (cacheManager as any).cache.set('old-key', oldEntry);
  const oldData = cacheManager.get('old-key');
  console.log('Old data retrieval (should be null):', oldData);
  console.log('✓ Test 2 passed' if oldData === null else '✗ Test 2 failed');
  
  // Test 3: Cache invalidation
  console.log('\nTest 3: Cache invalidation');
  cacheManager.set('invalidate-test', { data: 'should-be-deleted' });
  invalidateCache('invalidate-test');
  const invalidated = cacheManager.get('invalidate-test');
  console.log('After invalidation:', invalidated);
  console.log('✓ Test 3 passed' if invalidated === null else '✗ Test 3 failed');
  
  // Test 4: withCache function
  console.log('\nTest 4: withCache function');
  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount++;
    return { fetched: true, count: fetchCount };
  };
  
  const result1 = await withCache('with-cache-test', fetcher)();
  const result2 = await withCache('with-cache-test', fetcher)();
  console.log('First fetch count:', result1.count, 'Second fetch count:', result2.count);
  console.log('✓ Test 4 passed' if fetchCount === 1 else '✗ Test 4 failed (cache not working)');
  
  // Test 5: Force refresh
  console.log('\nTest 5: Force refresh');
  const result3 = await withCache('with-cache-test', fetcher, { forceRefresh: true })();
  console.log('After force refresh, fetch count:', result3.count);
  console.log('✓ Test 5 passed' if fetchCount === 2 else '✗ Test 5 failed (force refresh not working)');
  
  // Test 6: Cache stats
  console.log('\nTest 6: Cache stats');
  const stats = cacheManager.getStats();
  console.log('Cache stats:', stats);
  console.log('✓ Test 6 passed' if stats.size >= 0 else '✗ Test 6 failed');
  
  console.log('\n=== All Cache Tests Completed ===');
}