type CacheRecord<T> = {
  value: T
  expiresAt: number
}

export interface InMemoryCache<T> {
  get(key: string): T | null
  set(key: string, value: T): void
  delete(key: string): void
  clear(): void
  invalidate(predicate: (key: string) => boolean): void
}

type InMemoryCacheOptions = {
  ttlMs: number
  maxEntries: number
}

export function createInMemoryCache<T>({
  ttlMs,
  maxEntries,
}: InMemoryCacheOptions): InMemoryCache<T> {
  const store = new Map<string, CacheRecord<T>>()

  const enforceMaxEntries = () => {
    while (store.size > maxEntries) {
      const oldestKey = store.keys().next().value as string | undefined

      if (!oldestKey) {
        return
      }

      store.delete(oldestKey)
    }
  }

  return {
    get(key) {
      const record = store.get(key)

      if (!record) {
        return null
      }

      if (Date.now() > record.expiresAt) {
        store.delete(key)
        return null
      }

      return record.value
    },
    set(key, value) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      })
      enforceMaxEntries()
    },
    delete(key) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
    invalidate(predicate) {
      for (const key of store.keys()) {
        if (predicate(key)) {
          store.delete(key)
        }
      }
    },
  }
}
