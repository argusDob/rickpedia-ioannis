import { describe, expect, it, vi } from 'vitest'
import { createCharactersService, type Character } from './charactersService'
import type { HttpClient } from '../../../shared/api/httpClient'

function createCharacter(id: number): Character {
  return {
    id,
    name: `Character ${id}`,
    status: 'Alive',
    species: 'Human',
    gender: 'Male',
    image: `https://example.com/${id}.png`,
    location: {
      name: 'Earth',
    },
  }
}

describe('createCharactersService caching', () => {
  it('uses cached result for repeated getCharacterById calls', async () => {
    const character = createCharacter(1)
    const client: HttpClient = {
      get: vi.fn().mockResolvedValue(character),
      clearCache: vi.fn(),
      invalidateCache: vi.fn(),
    }
    const service = createCharactersService(client)

    const firstResult = await service.getCharacterById(1)
    const secondResult = await service.getCharacterById(1)

    expect(firstResult).toEqual(character)
    expect(secondResult).toEqual(character)
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('deduplicates in-flight getCharacterById requests', async () => {
    const character = createCharacter(2)
    const client: HttpClient = {
      get: vi.fn().mockResolvedValue(character),
      clearCache: vi.fn(),
      invalidateCache: vi.fn(),
    }
    const service = createCharactersService(client)

    const [firstResult, secondResult] = await Promise.all([
      service.getCharacterById(2),
      service.getCharacterById(2),
    ])

    expect(firstResult).toEqual(character)
    expect(secondResult).toEqual(character)
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('reuses cache in getCharactersByIds and keeps input order', async () => {
    const cachedCharacter = createCharacter(5)
    const fetchedCharacter = createCharacter(7)
    const client: HttpClient = {
      get: vi
        .fn()
        .mockResolvedValueOnce(cachedCharacter)
        .mockResolvedValueOnce(fetchedCharacter),
      clearCache: vi.fn(),
      invalidateCache: vi.fn(),
    }
    const service = createCharactersService(client)

    await service.getCharacterById(5)
    const result = await service.getCharactersByIds([7, 5, 7, -1])

    expect(result.map((character) => character.id)).toEqual([7, 5])
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenLastCalledWith(
      'https://rickandmortyapi.com/api/character/7',
      undefined,
      undefined,
    )
  })
})
