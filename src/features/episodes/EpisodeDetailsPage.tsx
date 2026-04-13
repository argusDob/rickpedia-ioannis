import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import { isAbortError } from '../../shared/api/httpClient'
import { episodesService, type Episode } from './services/episodesService'

export default function EpisodeDetailsPage() {
  const { id } = useParams()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const parsedId = Number(id)

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setEpisode(null)
      setLoading(false)
      setError('Invalid episode id')
      return
    }

    const abortController = new AbortController()
    let isCancelled = false

    async function loadEpisode() {
      try {
        setLoading(true)
        setError(null)
        const response = await episodesService.getEpisodeById(parsedId, abortController.signal)

        if (isCancelled) {
          return
        }

        setEpisode(response)
      } catch (err) {
        if (isCancelled || isAbortError(err)) {
          return
        }

        setEpisode(null)
        setError(err instanceof Error ? err.message : 'Unexpected error while loading episode')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void loadEpisode()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [id])

  if (loading) {
    return <SuspenseFallback message="Loading episode details..." />
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link to="/episodes" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to episodes
        </Link>
        <p className="text-red-600">{error}</p>
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
