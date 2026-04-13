import { createInMemoryCache } from '../utils/inMemoryCache'

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

const DEFAULT_TTL_MS = 60_000
const MAX_CACHE_ENTRIES = 200
const responseCache = createInMemoryCache<unknown>({
  ttlMs: DEFAULT_TTL_MS,
  maxEntries: MAX_CACHE_ENTRIES,
})

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

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof TypeError) {
    return 'Network error. Please check your connection and try again.'
  }

  if (error instanceof HttpError) {
    if (error.status === 404) {
      return 'No results found.'
    }

    if (error.status === 429) {
      return 'Too many retries. Please try again shortly.'
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.'
    }
  }

  return error instanceof Error ? error.message : fallbackMessage
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
        const cached = responseCache.get(cacheKey) as T | null

        if (cached !== null) {
          return cached
        }
      }

      const response = await fetch(requestUrl, signal ? { signal } : {})

      if (!response.ok) {
        throw new HttpError(
          `Request failed with status ${response.status}`,
          response.status,
          response.statusText,
        )
      }

      const data = (await response.json()) as T

      if (shouldUseCache) {
        responseCache.set(cacheKey, data)
      }

      return data
    },
    clearCache() {
      responseCache.clear()
    },
    invalidateCache(predicate: (key: string) => boolean) {
      responseCache.invalidate(predicate)
    },
  }
}

export const httpClient = createFetchHttpClient()
