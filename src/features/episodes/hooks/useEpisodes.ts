import { useCallback, useState } from 'react'
import { episodesService, type Episode, type EpisodesService } from '../services/episodesService'
import { getApiErrorMessage } from '../../../shared/api/httpClient'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useAsyncRequest } from '../../../shared/hooks/useAsyncRequest'

type UseEpisodesResult = {
  data: Episode[]
  loading: boolean
  error: string | null
  retry: () => void
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
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [nameFilter, setNameFilter] = useState(initialNameFilter)
  const debouncedNameFilter = useDebouncedValue(nameFilter, 500)

  const handleNameFilterChange = useCallback((value: string) => {
    setPage(1)
    setNameFilter(value)
  }, [])

  const request = useCallback((signal: AbortSignal) => (
    service.getEpisodes(page, { name: debouncedNameFilter }, signal)
  ), [debouncedNameFilter, page, service])
  const handleSuccess = useCallback((response: Awaited<ReturnType<EpisodesService['getEpisodes']>>) => {
    setData((currentEpisodes) => (page === 1 ? response.results : [...currentEpisodes, ...response.results]))
    setTotalPages(response.info.pages)
  }, [page])
  const handleError = useCallback(() => {
    setData([])
    setTotalPages(1)
  }, [])

  const { loading, error, retry } = useAsyncRequest({
    request,
    onSuccess: handleSuccess,
    onError: handleError,
    getErrorMessage: (err) => getApiErrorMessage(err, 'Unexpected error while loading episodes'),
  })
  const loadMore = useCallback(() => {
    if (loading || page >= totalPages) {
      return
    }

    setPage((currentPage) => Math.min(currentPage + 1, totalPages))
  }, [loading, page, totalPages])

  return {
    data,
    loading,
    error,
    retry,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    nameFilter,
    setNameFilter: handleNameFilterChange,
    loadMore,
  }
}
