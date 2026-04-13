import { httpClient, type HttpClient } from '../../../shared/api/httpClient'
import { createInMemoryCache } from '../../../shared/utils/inMemoryCache'

const CHARACTER_API_URL = 'https://rickandmortyapi.com/api/character'
const CHARACTER_DETAILS_TTL_MS = 60_000

type ApiPaginationInfo = {
  count: number
  pages: number
  next: string | null
  prev: string | null
}

export type Character = {
  id: number
  name: string
  status: string
  species: string
  gender: string
  image: string
  location: {
    name: string
  }
}

export type CharacterFilters = {
  name?: string
  status?: string
  species?: string
  gender?: string
}

export type CharactersResponse = {
  info: ApiPaginationInfo
  results: Character[]
}

export interface CharactersService {
  getCharacters(page: number, filters?: CharacterFilters, signal?: AbortSignal): Promise<CharactersResponse>
  getCharacterById(id: number, signal?: AbortSignal): Promise<Character>
  getCharactersByIds(ids: number[], signal?: AbortSignal): Promise<Character[]>
}

const characterDetailsCache = createInMemoryCache<Character>({
  ttlMs: CHARACTER_DETAILS_TTL_MS,
  maxEntries: 500,
})
const characterDetailsInFlight = new Map<number, Promise<Character>>()

function getCharacterCacheKey(id: number) {
  return String(id)
}

function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise
  }

  if (signal.aborted) {
    return Promise.reject(createAbortError())
  }

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(createAbortError())
    signal.addEventListener('abort', handleAbort, { once: true })

    promise
      .then((value) => {
        signal.removeEventListener('abort', handleAbort)
        resolve(value)
      })
      .catch((error: unknown) => {
        signal.removeEventListener('abort', handleAbort)
        reject(error)
      })
  })
}

export function createCharactersService(client: HttpClient): CharactersService {
  return {
    getCharacters(page, filters = {}, signal) {
      return client.get<CharactersResponse>(CHARACTER_API_URL, {
        page,
        ...filters,
      }, signal)
    },
    getCharacterById(id, signal) {
      const cacheKey = getCharacterCacheKey(id)
      const cachedCharacter = characterDetailsCache.get(cacheKey)

      if (cachedCharacter) {
        return withAbortSignal(Promise.resolve(cachedCharacter), signal)
      }

      const existingRequest = characterDetailsInFlight.get(id)

      if (existingRequest) {
        return withAbortSignal(existingRequest, signal)
      }

      const request = client
        .get<Character>(`${CHARACTER_API_URL}/${id}`)
        .then((character) => {
          characterDetailsCache.set(cacheKey, character)

          return character
        })
        .finally(() => {
          characterDetailsInFlight.delete(id)
        })

      characterDetailsInFlight.set(id, request)

      return withAbortSignal(request, signal)
    },
    async getCharactersByIds(ids, signal) {
      const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)))

      if (uniqueIds.length === 0) {
        return []
      }

      const resolvedCharacters = new Map<number, Character>()
      const missingIds: number[] = []

      uniqueIds.forEach((id) => {
        const cacheKey = getCharacterCacheKey(id)
        const cachedCharacter = characterDetailsCache.get(cacheKey)

        if (cachedCharacter) {
          resolvedCharacters.set(id, cachedCharacter)
          return
        }

        missingIds.push(id)
      })

      if (missingIds.length > 0) {
        const response = await client.get<Character | Character[]>(
          `${CHARACTER_API_URL}/${missingIds.join(',')}`,
          undefined,
          signal,
        )
        const characters = Array.isArray(response) ? response : [response]

        characters.forEach((character) => {
          characterDetailsCache.set(getCharacterCacheKey(character.id), character)
          resolvedCharacters.set(character.id, character)
        })
      }

      return uniqueIds.flatMap((id) => {
        const character = resolvedCharacters.get(id)
        return character ? [character] : []
      })
    },
  }
}

export const charactersService = createCharactersService(httpClient)
