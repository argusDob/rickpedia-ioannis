import { useCallback, useMemo, useState } from 'react'
import {
  charactersService,
  type Character,
  type CharacterFilters,
  type CharactersService,
} from '../services/charactersService'
import { getApiErrorMessage } from '../../../shared/api/httpClient'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useAsyncRequest } from '../../../shared/hooks/useAsyncRequest'

type UseCharactersResult = {
  data: Character[]
  loading: boolean
  error: string | null
  retry: () => void
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nameFilter: string
  setNameFilter: (value: string) => void
  nextPage: () => void
  prevPage: () => void
}

type UseCharactersOptions = {
  initialPage?: number
  initialNameFilter?: string
}

export function useCharacters(
  options: UseCharactersOptions = {},
  service: CharactersService = charactersService,
): UseCharactersResult {
  const { initialPage = 1, initialNameFilter = '' } = options
  const [data, setData] = useState<Character[]>([])
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [nameFilter, setNameFilter] = useState(initialNameFilter)
  const debouncedNameFilter = useDebouncedValue(nameFilter, 500)

  const handleNameFilterChange = useCallback((value: string) => {
    setPage(1)
    setNameFilter(value)
  }, [])

  const nextPage = useCallback(() => {
    setPage((currentPage) => Math.min(currentPage + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage((currentPage) => Math.max(currentPage - 1, 1))
  }, [])

  const filters = useMemo<CharacterFilters>(() => ({ name: debouncedNameFilter }), [debouncedNameFilter])
  const request = useCallback((signal: AbortSignal) => service.getCharacters(page, filters, signal), [filters, page, service])
  const handleSuccess = useCallback((response: Awaited<ReturnType<CharactersService['getCharacters']>>) => {
    setData(response.results)
    setTotalPages(response.info.pages)
  }, [])
  const handleError = useCallback(() => {
    setData([])
    setTotalPages(1)
  }, [])

  const { loading, error, retry } = useAsyncRequest({
    deps: [request],
    request,
    onSuccess: handleSuccess,
    onError: handleError,
    getErrorMessage: (err) => getApiErrorMessage(err, 'Unexpected error while loading characters'),
  })

  return {
    data,
    loading,
    error,
    retry,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nameFilter,
    setNameFilter: handleNameFilterChange,
    nextPage,
    prevPage,
  }
}
