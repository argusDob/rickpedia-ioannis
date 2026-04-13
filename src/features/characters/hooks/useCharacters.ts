import { useEffect, useState } from 'react'
import {
  charactersService,
  type Character,
  type CharacterFilters,
  type CharactersService,
} from '../services/charactersService'
import { isAbortError } from '../../../shared/api/httpClient'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'

type UseCharactersResult = {
  data: Character[]
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [nameFilter, setNameFilter] = useState(initialNameFilter)
  const debouncedNameFilter = useDebouncedValue(nameFilter, 500)

  useEffect(() => {
    const filters: CharacterFilters = { name: debouncedNameFilter }
    const abortController = new AbortController()
    let isCancelled = false

    async function loadCharacters() {
      try {
        setLoading(true)
        setError(null)
        const response = await service.getCharacters(page, filters, abortController.signal)

        if (isCancelled) {
          return
        }

        setData(response.results)
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
        setError(err instanceof Error ? err.message : 'Unexpected error while loading characters')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadCharacters()

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
