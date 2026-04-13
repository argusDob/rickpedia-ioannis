import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEpisodes } from './useEpisodes'
import type { EpisodesResponse, EpisodesService } from '../services/episodesService'

vi.mock('../../../shared/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}))

function createEpisodeResponse(page: number, ids: number[], totalPages = 2): EpisodesResponse {
  return {
    info: {
      count: totalPages * 20,
      pages: totalPages,
      next: page < totalPages ? `https://example.com?page=${page + 1}` : null,
      prev: page > 1 ? `https://example.com?page=${page - 1}` : null,
    },
    results: ids.map((id) => ({
      id,
      name: `Episode ${id}`,
      episode: `S01E${String(id).padStart(2, '0')}`,
      air_date: 'January 1, 2013',
      characters: [],
    })),
  }
}

describe('useEpisodes', () => {
  it('appends next page results when loadMore is called', async () => {
    const getEpisodes = vi
      .fn<EpisodesService['getEpisodes']>()
      .mockResolvedValueOnce(createEpisodeResponse(1, [1, 2], 2))
      .mockResolvedValueOnce(createEpisodeResponse(2, [3, 4], 2))
    const service: EpisodesService = {
      getEpisodes,
      getEpisodeById: vi.fn(),
    }

    const { result } = renderHook(() => useEpisodes({}, service))

    await waitFor(() => {
      expect(result.current.data.map((episode) => episode.id)).toEqual([1, 2])
    })

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.data.map((episode) => episode.id)).toEqual([1, 2, 3, 4])
    })

    expect(result.current.page).toBe(2)
    expect(getEpisodes).toHaveBeenCalledTimes(2)
  })

  it('does not request a new page when already at the end', async () => {
    const getEpisodes = vi
      .fn<EpisodesService['getEpisodes']>()
      .mockResolvedValue(createEpisodeResponse(1, [1], 1))
    const service: EpisodesService = {
      getEpisodes,
      getEpisodeById: vi.fn(),
    }
    const { result } = renderHook(() => useEpisodes({}, service))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.page).toBe(1)
    expect(getEpisodes).toHaveBeenCalledTimes(1)
  })
})
