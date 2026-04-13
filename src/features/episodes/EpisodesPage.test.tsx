import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import EpisodesPage from './EpisodesPage'

const loadMoreSpy = vi.fn()
let latestIntersectHandler: (() => void) | undefined

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('./hooks/useEpisodes', () => ({
  useEpisodes: () => ({
    data: [
      {
        id: 1,
        name: 'Pilot',
        episode: 'S01E01',
        air_date: 'December 2, 2013',
        characters: [],
      },
    ],
    loading: false,
    error: null,
    page: 1,
    totalPages: 2,
    hasNextPage: true,
    nameFilter: '',
    setNameFilter: vi.fn(),
    loadMore: loadMoreSpy,
  }),
}))

vi.mock('../../shared/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: ({
    onIntersect,
  }: {
    onIntersect: () => void
  }) => {
    latestIntersectHandler = onIntersect
    return vi.fn()
  },
}))

describe('EpisodesPage infinite scroll', () => {
  beforeEach(() => {
    loadMoreSpy.mockReset()
    latestIntersectHandler = undefined
  })

  it('calls loadMore when intersection observer intersects', async () => {
    render(<EpisodesPage />)

    await waitFor(() => {
      expect(typeof latestIntersectHandler).toBe('function')
    })

    latestIntersectHandler?.()

    expect(loadMoreSpy).toHaveBeenCalledTimes(1)
  })
})
