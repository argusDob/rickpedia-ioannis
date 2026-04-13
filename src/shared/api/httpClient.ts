export interface HttpClient {
  get<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
    signal?: AbortSignal,
  ): Promise<T>
  clearCache(): void
  invalidateCache(predicate: (key: string) => boolean): void
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  )
}

type CacheEntry = {
  data: unknown
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 60_000
const MAX_CACHE_ENTRIES = 200

function buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>) {
  const requestUrl = new URL(url)

  if (!params) {
    return requestUrl.toString()
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    requestUrl.searchParams.set(key, String(value))
  })

  return requestUrl.toString()
}

function buildQueryCacheKey(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  if (!params) {
    return `${url}::`
  }

  const normalizedEntries: [string, string][] = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map<[string, string]>(([key, value]) => {
      if (typeof value === 'string') {
        return [key, value.trim().toLowerCase()]
      }

      return [key, String(value)]
    })
    .sort(([a], [b]) => a.localeCompare(b))

  const query = new URLSearchParams(normalizedEntries).toString()
  return `${url}::${query}`
}

function enforceMaxEntries() {
  while (responseCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value as string | undefined

    if (!oldestKey) {
      return
    }

    responseCache.delete(oldestKey)
  }
}

function getCached<T>(key: string) {
  const cached = responseCache.get(key)

  if (!cached) {
    return null
  }

  if (Date.now() > cached.expiresAt) {
    responseCache.delete(key)
    return null
  }

  return cached.data as T
}

export class HttpError extends Error {
  public readonly status: number
  public readonly statusText: string

  constructor(message: string, status: number, statusText: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
  }
}

export function createFetchHttpClient(): HttpClient {
  return {
    async get<T>(
      url: string,
      params?: Record<string, string | number | boolean | undefined>,
      signal?: AbortSignal,
    ) {
      const requestUrl = buildUrl(url, params)
      const cacheKey = buildQueryCacheKey(url, params)
      const shouldUseCache = typeof params?.name === 'string' && params.name.trim().length > 0

      if (shouldUseCache) {
        const cached = getCached<T>(cacheKey)

        if (cached !== null) {
          return cached
        }
      }

      const response = await fetch(requestUrl, { signal })

      if (!response.ok) {
        throw new HttpError(
          `Request failed with status ${response.status}`,
          response.status,
          response.statusText,
        )
      }

      const data = (await response.json()) as T

      if (shouldUseCache) {
        responseCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + DEFAULT_TTL_MS,
        })

        console.log('responseCache', responseCache)
        enforceMaxEntries()
      }

      return data
    },
    clearCache() {
      responseCache.clear()
    },
    invalidateCache(predicate: (key: string) => boolean) {
      for (const key of responseCache.keys()) {
        if (predicate(key)) {
          responseCache.delete(key)
        }
      }
    },
  }
}

export const httpClient = createFetchHttpClient()
