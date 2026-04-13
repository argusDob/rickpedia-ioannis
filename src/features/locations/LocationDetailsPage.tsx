import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import ErrorState from '../../shared/components/ErrorState'
import { getApiErrorMessage } from '../../shared/api/httpClient'
import { locationsService, type Location } from './services/locationsService'
import { useAsyncRequest } from '../../shared/hooks/useAsyncRequest'

export default function LocationDetailsPage() {
  const { id } = useParams()
  const [location, setLocation] = useState<Location | null>(null)
  const parsedId = useMemo(() => Number(id), [id])
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0
  const request = useCallback((signal: AbortSignal) => {
    if (!hasValidId) {
      return Promise.reject(new Error('Invalid location id'))
    }

    return locationsService.getLocationById(parsedId, signal)
  }, [hasValidId, parsedId])

  const { loading, error, retry } = useAsyncRequest({
    deps: [request],
    request,
    onSuccess: setLocation,
    onError: () => setLocation(null),
    getErrorMessage: (err) => hasValidId
      ? getApiErrorMessage(err, 'Unexpected error while loading location')
      : 'Invalid location id',
  })

  if (loading) {
    return <SuspenseFallback message="Loading location details..." />
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link to="/locations" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to locations
        </Link>
        <ErrorState message={error} actionLabel="Try again" onAction={retry} />
      </section>
    )
  }

  if (!location) {
    return (
      <section className="space-y-4">
        <Link to="/locations" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to locations
        </Link>
        <p className="text-slate-600">Location not found.</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <Link to="/locations" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
        Back to locations
      </Link>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">{location.name}</h1>
        <p className="mt-2 text-slate-600">Type: {location.type}</p>
        <p className="text-slate-600">Dimension: {location.dimension}</p>
        <p className="text-slate-600">Residents: {location.residents.length}</p>
      </article>
    </section>
  )
}
