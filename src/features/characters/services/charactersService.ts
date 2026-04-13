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
        return Promise.resolve(cachedCharacter)
      }

      const existingRequest = !signal ? characterDetailsInFlight.get(id) : undefined

      if (existingRequest) {
        return existingRequest
      }

      const request = client
        .get<Character>(`${CHARACTER_API_URL}/${id}`, undefined, signal)
        .then((character) => {
          characterDetailsCache.set(cacheKey, character)

          return character
        })

      if (!signal) {
        const dedupedRequest = request.finally(() => {
          characterDetailsInFlight.delete(id)
        })
        characterDetailsInFlight.set(id, dedupedRequest)
        return dedupedRequest
      }

      return request
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
