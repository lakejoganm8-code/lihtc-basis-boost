interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory request cache with TTL.
 * Suitable for serverless/edge deployments where each invocation
 * gets its own memory space.
 */
export class RequestCache<T> {
  private store: Map<string, CacheEntry<T>>;
  private defaultTtlMs: number;
  private maxEntries: number;

  constructor(defaultTtlMs = 30 * 60 * 1000, maxEntries = 5000) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
