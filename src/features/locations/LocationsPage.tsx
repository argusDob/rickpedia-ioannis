import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLocations } from './hooks/useLocations'
import FilterInput from '../../shared/components/FilterInput'
import PaginationControls from '../../shared/components/PaginationControls'
import SuspenseFallback from '../../shared/components/SuspenseFallback'

export default function LocationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedPage = Number(searchParams.get('page'))
  const initialPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const initialNameFilter = searchParams.get('name') ?? ''

  const {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nameFilter,
    setNameFilter,
    nextPage,
    prevPage,
  } = useLocations({ initialPage, initialNameFilter })

  useEffect(() => {
    const nextSearchParams = new URLSearchParams()

    if (page > 1) {
      nextSearchParams.set('page', String(page))
    }

    if (nameFilter.trim().length > 0) {
      nextSearchParams.set('name', nameFilter)
    }

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [nameFilter, page, searchParams, setSearchParams])

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Locations</h1>
        <p className="text-slate-600">Discover locations across the universe.</p>
      </header>

      <FilterInput
        label="Filter by name"
        value={nameFilter}
        onChange={setNameFilter}
        placeholder="e.g. Citadel"
      />

      {loading && <SuspenseFallback message="Loading locations..." />}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <ul className="space-y-3">
            {data.map((location) => (
              <li key={location.id} className="rounded-md border border-slate-200 bg-white p-4">
                <button
                  type="button"
                  onClick={() => navigate(`/locations/${location.id}`)}
                  className="text-left text-lg font-semibold text-slate-900 transition hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  {location.name}
                </button>
                <p className="text-sm text-slate-600">Type: {location.type}</p>
                <p className="text-sm text-slate-600">Dimension: {location.dimension}</p>
              </li>
            ))}
          </ul>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </>
      )}
    </section>
  )
}
