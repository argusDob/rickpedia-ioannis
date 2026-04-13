import { useEffect, useState } from 'react'
import {
  locationsService,
  type Location,
  type LocationsService,
} from '../services/locationsService'
import { isAbortError } from '../../../shared/api/httpClient'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'

const ITEMS_PER_UI_PAGE = 10
const API_PAGE_SIZE = 20

type UseLocationsResult = {
  data: Location[]
  loading: boolean
  error: string | null
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
  const [data, setData] = useState<Location[]>([])
  const [apiResults, setApiResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [nameFilter, setNameFilter] = useState(initialNameFilter)
  const debouncedNameFilter = useDebouncedValue(nameFilter, 500)
  const apiPage = Math.floor((page - 1) / (API_PAGE_SIZE / ITEMS_PER_UI_PAGE)) + 1
  const subPageIndex = (page - 1) % (API_PAGE_SIZE / ITEMS_PER_UI_PAGE)

  useEffect(() => {
    const abortController = new AbortController()
    let isCancelled = false

    async function loadLocations() {
      try {
        setLoading(true)
        setError(null)
        const response = await service.getLocations(
          apiPage,
          { name: debouncedNameFilter },
          abortController.signal,
        )

        if (isCancelled) {
          return
        }

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
      } catch (err) {
        if (isCancelled) {
          return
        }

        if (isAbortError(err)) {
          return
        }

        setData([])
        setApiResults([])
        setTotalPages(1)
        setError(err instanceof Error ? err.message : 'Unexpected error while loading locations')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadLocations()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [apiPage, debouncedNameFilter, service])

  useEffect(() => {
    const sliceStart = subPageIndex * ITEMS_PER_UI_PAGE
    const nextData = apiResults.slice(sliceStart, sliceStart + ITEMS_PER_UI_PAGE)

    if (nextData.length === 0 && subPageIndex > 0 && !loading) {
      setPage((currentPage) => Math.max(currentPage - 1, 1))
      return
    }

    setData(nextData)
  }, [apiResults, loading, subPageIndex])

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nameFilter,
    setNameFilter: (value) => {
      setPage(1)
      setNameFilter(value)
    },
    nextPage: () => setPage((currentPage) => Math.min(currentPage + 1, totalPages)),
    prevPage: () => setPage((currentPage) => Math.max(currentPage - 1, 1)),
  }
}
