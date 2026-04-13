import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import ErrorState from '../../shared/components/ErrorState'
import { getApiErrorMessage } from '../../shared/api/httpClient'
import { episodesService, type Episode } from './services/episodesService'
import { useAsyncRequest } from '../../shared/hooks/useAsyncRequest'

export default function EpisodeDetailsPage() {
  const { id } = useParams()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const parsedId = useMemo(() => Number(id), [id])
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0
  const request = useCallback((signal: AbortSignal) => {
    if (!hasValidId) {
      return Promise.reject(new Error('Invalid episode id'))
    }

    return episodesService.getEpisodeById(parsedId, signal)
  }, [hasValidId, parsedId])

  const { loading, error, retry } = useAsyncRequest({
    deps: [request],
    request,
    onSuccess: setEpisode,
    onError: () => setEpisode(null),
    getErrorMessage: (err) => hasValidId
      ? getApiErrorMessage(err, 'Unexpected error while loading episode')
      : 'Invalid episode id',
  })

  if (loading) {
    return <SuspenseFallback message="Loading episode details..." />
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link to="/episodes" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to episodes
        </Link>
        <ErrorState message={error} actionLabel="Try again" onAction={retry} />
      </section>
    )
  }

  if (!episode) {
    return (
      <section className="space-y-4">
        <Link to="/episodes" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to episodes
        </Link>
        <p className="text-slate-600">Episode not found.</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <Link to="/episodes" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
        Back to episodes
      </Link>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">{episode.name}</h1>
        <p className="mt-2 text-slate-600">Code: {episode.episode}</p>
        <p className="text-slate-600">Aired: {episode.air_date}</p>
        <p className="text-slate-600">Characters: {episode.characters.length}</p>
      </article>
    </section>
  )
}
