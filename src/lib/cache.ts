/**
 * Simple in-memory cache implementation
 * For production, consider using Redis or a more robust caching solution
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class InMemoryCache {
  private cache = new Map<string, CacheItem<unknown>>()
  private maxSize = 1000 // Maximum number of items in cache
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // If cache is full, remove oldest items
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Remove expired items
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        removed++
      }
    })

    return removed
  }

  /**
   * Evict oldest items when cache is full
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// Create singleton instance
export const cache = new InMemoryCache()

// Cache key generators
export const cacheKeys = {
  users: (limit?: number, role?: string) => `users:${limit || 'all'}:${role || 'all'}`,
  user: (uid: string) => `user:${uid}`,
  dashboardStats: () => 'dashboard:stats',
  travellers: (userId?: string, role?: string) => `travellers:${userId || 'all'}:${role || 'all'}`,
  traveller: (id: string) => `traveller:${id}`,
  slides: () => 'slides:all',
}

// Cache TTL constants (in milliseconds)
export const cacheTTL = {
  users: 2 * 60 * 1000, // 2 minutes
  user: 5 * 60 * 1000, // 5 minutes
  dashboardStats: 1 * 60 * 1000, // 1 minute
  travellers: 2 * 60 * 1000, // 2 minutes
  traveller: 5 * 60 * 1000, // 5 minutes
  slides: 10 * 60 * 1000, // 10 minutes
}

// Utility functions
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> => {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Store in cache
  cache.set(key, data, ttl)

  return data
}

// Cleanup expired items every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      cache.cleanup()
    },
    5 * 60 * 1000,
  )
}
