import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import { isAbortError } from '../../shared/api/httpClient'
import { locationsService, type Location } from './services/locationsService'

export default function LocationDetailsPage() {
  const { id } = useParams()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const parsedId = Number(id)

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setLocation(null)
      setLoading(false)
      setError('Invalid location id')
      return
    }

    const abortController = new AbortController()
    let isCancelled = false

    async function loadLocation() {
      try {
        setLoading(true)
        setError(null)
        const response = await locationsService.getLocationById(parsedId, abortController.signal)

        if (isCancelled) {
          return
        }

        setLocation(response)
      } catch (err) {
        if (isCancelled || isAbortError(err)) {
          return
        }

        setLocation(null)
        setError(err instanceof Error ? err.message : 'Unexpected error while loading location')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void loadLocation()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [id])

  if (loading) {
    return <SuspenseFallback message="Loading location details..." />
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link to="/locations" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to locations
        </Link>
        <p className="text-red-600">{error}</p>
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
