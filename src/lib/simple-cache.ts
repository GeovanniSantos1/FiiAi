/**
 * Cache simples em memória para dados que mudam raramente
 * Sem dependência externa (Redis, etc.)
 *
 * PLAN-006 - Sistema de Cache In-Memory
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * Clear specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear expired entries (garbage collection)
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      keys: this.keys(),
    };
  }
}

// Singleton instance
export const memoryCache = new SimpleMemoryCache();

/**
 * Helper function to get or fetch data
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Cache hit: ${key}`);
    }
    return cached;
  }

  // Cache miss - fetch data
  if (process.env.NODE_ENV === 'development') {
    console.log(`⏳ Cache miss: ${key}`);
  }
  const data = await fetcher();

  // Store in cache
  memoryCache.set(key, data, ttlSeconds);

  return data;
}

/**
 * Decorator for caching function results
 */
export function cached(ttlSeconds: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      return getCachedOrFetch(cacheKey, () => originalMethod.apply(this, args), ttlSeconds);
    };

    return descriptor;
  };
}

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userCredits: (clerkUserId: string) => `credits:${clerkUserId}`,
  portfolio: (portfolioId: string) => `portfolio:${portfolioId}`,
  portfolioList: (userId: string) => `portfolios:${userId}`,
  analysis: (analysisId: string) => `analysis:${analysisId}`,
  analysisList: (userId: string) => `analyses:${userId}`,
  adminSettings: () => 'admin:settings',
  plans: () => 'plans:all',
  activePlans: () => 'plans:active',
  recommendedFunds: (portfolioId: string) => `funds:${portfolioId}`,
  aporteHistory: (userId: string) => `aportes:${userId}`,
  creditStats: (userId: string, days: number) => `credit-stats:${userId}:${days}`,
  notifications: (userId: string) => `notifications:${userId}`,
  unreadCount: (userId: string) => `unread-count:${userId}`,
} as const;

/**
 * Invalidation patterns for related cache entries
 */
export const InvalidatePatterns = {
  user: (userId: string) => [
    CacheKeys.user(userId),
    CacheKeys.portfolioList(userId),
    CacheKeys.analysisList(userId),
  ],
  portfolio: (userId: string, portfolioId: string) => [
    CacheKeys.portfolio(portfolioId),
    CacheKeys.portfolioList(userId),
    CacheKeys.recommendedFunds(portfolioId),
  ],
  analysis: (userId: string, analysisId: string) => [
    CacheKeys.analysis(analysisId),
    CacheKeys.analysisList(userId),
  ],
  credits: (userId: string, clerkUserId: string) => [
    CacheKeys.userCredits(clerkUserId),
    CacheKeys.creditStats(userId, 30),
    CacheKeys.creditStats(userId, 7),
  ],
  adminSettings: () => [CacheKeys.adminSettings()],
  plans: () => [CacheKeys.plans(), CacheKeys.activePlans()],
};

/**
 * Bulk invalidation helper
 */
export function invalidateKeys(keys: string[]) {
  keys.forEach((key) => memoryCache.delete(key));
  if (process.env.NODE_ENV === 'development') {
    console.log(`🗑️  Invalidated ${keys.length} cache entries`);
  }
}

// Auto-cleanup expired entries every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(
    () => {
      const cleared = memoryCache.clearExpired();
      if (cleared > 0 && process.env.NODE_ENV === 'development') {
        console.log(`🧹 Cleared ${cleared} expired cache entries`);
      }
    },
    5 * 60 * 1000
  ); // 5 minutes
}
