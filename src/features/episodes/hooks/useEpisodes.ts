import { useCallback, useEffect, useState } from 'react'
import { episodesService, type Episode, type EpisodesService } from '../services/episodesService'
import { isAbortError } from '../../../shared/api/httpClient'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'

type UseEpisodesResult = {
  data: Episode[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  hasNextPage: boolean
  nameFilter: string
  setNameFilter: (value: string) => void
  loadMore: () => void
}

type UseEpisodesOptions = {
  initialPage?: number
  initialNameFilter?: string
}

export function useEpisodes(
  options: UseEpisodesOptions = {},
  service: EpisodesService = episodesService,
): UseEpisodesResult {
  const { initialPage = 1, initialNameFilter = '' } = options
  const [data, setData] = useState<Episode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [nameFilter, setNameFilter] = useState(initialNameFilter)
  const debouncedNameFilter = useDebouncedValue(nameFilter, 500)

  const handleNameFilterChange = useCallback((value: string) => {
    setPage(1)
    setNameFilter(value)
  }, [])

  const loadMore = useCallback(() => {
    if (loading || page >= totalPages) {
      return
    }

    setPage((currentPage) => Math.min(currentPage + 1, totalPages))
  }, [loading, page, totalPages])

  useEffect(() => {
    const abortController = new AbortController()
    let isCancelled = false

    async function loadEpisodes() {
      try {
        setLoading(true)
        setError(null)
        const response = await service.getEpisodes(
          page,
          { name: debouncedNameFilter },
          abortController.signal,
        )

        if (isCancelled) {
          return
        }

        setData((currentEpisodes) => (page === 1 ? response.results : [...currentEpisodes, ...response.results]))
        setTotalPages(response.info.pages)
      } catch (err) {
        if (isCancelled) {
          return
        }

        if (isAbortError(err)) {
          return
        }

        setData([])
        setTotalPages(1)
        setError(err instanceof Error ? err.message : 'Unexpected error while loading episodes')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadEpisodes()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [page, debouncedNameFilter, service])

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    nameFilter,
    setNameFilter: handleNameFilterChange,
    loadMore,
  }
}
