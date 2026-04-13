import { useCallback, useMemo, useState } from 'react'
import {
  locationsService,
  type Location,
  type LocationsService,
} from '../services/locationsService'
import { getApiErrorMessage } from '../../../shared/api/httpClient'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useAsyncRequest } from '../../../shared/hooks/useAsyncRequest'

const ITEMS_PER_UI_PAGE = 10
const API_PAGE_SIZE = 20

type UseLocationsResult = {
  data: Location[]
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

type UseLocationsOptions = {
  initialPage?: number
  initialNameFilter?: string
}

export function useLocations(
  options: UseLocationsOptions = {},
  service: LocationsService = locationsService,
): UseLocationsResult {
  const { initialPage = 1, initialNameFilter = '' } = options
  const [apiResults, setApiResults] = useState<Location[]>([])
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [nameFilter, setNameFilter] = useState(initialNameFilter)
  const debouncedNameFilter = useDebouncedValue(nameFilter, 500)
  const apiPage = Math.floor((page - 1) / (API_PAGE_SIZE / ITEMS_PER_UI_PAGE)) + 1
  const subPageIndex = (page - 1) % (API_PAGE_SIZE / ITEMS_PER_UI_PAGE)

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

  const request = useCallback((signal: AbortSignal) => (
    service.getLocations(apiPage, { name: debouncedNameFilter }, signal)
  ), [apiPage, debouncedNameFilter, service])
  const handleSuccess = useCallback((response: Awaited<ReturnType<LocationsService['getLocations']>>) => {
    setApiResults(response.results)

    const subPagesInCurrentApiPage = Math.max(
      1,
      Math.ceil(response.results.length / ITEMS_PER_UI_PAGE),
    )
    const totalUiPages = Math.max(
      1,
      (response.info.pages - 1) * (API_PAGE_SIZE / ITEMS_PER_UI_PAGE) + subPagesInCurrentApiPage,
    )
    setTotalPages(totalUiPages)
  }, [])
  const handleError = useCallback(() => {
    setApiResults([])
    setTotalPages(1)
  }, [])

  const { loading, error, retry } = useAsyncRequest({
    request,
    onSuccess: handleSuccess,
    onError: handleError,
    getErrorMessage: (err) => getApiErrorMessage(err, 'Unexpected error while loading locations'),
  })

  const data = useMemo(() => {
    const sliceStart = subPageIndex * ITEMS_PER_UI_PAGE
    return apiResults.slice(sliceStart, sliceStart + ITEMS_PER_UI_PAGE)
  }, [apiResults, subPageIndex])

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
