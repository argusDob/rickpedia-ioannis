import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import ErrorState from '../../shared/components/ErrorState'
import { getApiErrorMessage } from '../../shared/api/httpClient'
import { locationsService, type Location } from './services/locationsService'
import CharacterCard from '../characters/components/CharacterCard'
import { charactersService, type Character } from '../characters/services/charactersService'
import { useAsyncRequest } from '../../shared/hooks/useAsyncRequest'

export default function LocationDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [location, setLocation] = useState<Location | null>(null)
  const [residents, setResidents] = useState<Character[]>([])
  const [residentsLoading, setResidentsLoading] = useState(false)
  const [residentsError, setResidentsError] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const parsedId = useMemo(() => Number(id), [id])
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0
  const request = useCallback((signal: AbortSignal) => {
    if (!hasValidId) {
      return Promise.reject(new Error('Invalid location id'))
    }

    return locationsService.getLocationById(parsedId, signal)
  }, [hasValidId, parsedId])

  const { loading, error, retry } = useAsyncRequest({
    request,
    onSuccess: (nextLocation) => {
      setLocation(nextLocation)
      setResidents([])
      setResidentsError(null)
    },
    onError: () => {
      setLocation(null)
      setResidents([])
      setResidentsError(null)
    },
    getErrorMessage: (err) => hasValidId
      ? getApiErrorMessage(err, 'Unexpected error while loading location')
      : 'Invalid location id',
  })

  const getResidentIds = useCallback((residentUrls: string[]) => (
    Array.from(new Set(residentUrls
      .map((url) => Number(url.split('/').at(-1)))
      .filter((residentId) => Number.isInteger(residentId) && residentId > 0)))
  ), [])

  useEffect(() => {
    if (!location) {
      return
    }

    const residentIds = getResidentIds(location.residents)

    if (residentIds.length === 0) {
      setResidents([])
      setResidentsError(null)
      setResidentsLoading(false)
      return
    }

    let isCancelled = false
    const abortController = new AbortController()

    async function loadResidents() {
      try {
        setResidentsLoading(true)
        setResidentsError(null)
        const residentCharacters = await charactersService.getCharactersByIds(
          residentIds,
          abortController.signal,
        )

        if (!isCancelled) {
          setResidents(residentCharacters)
        }
      } catch (residentError) {
        if (!isCancelled) {
          setResidents([])
          setResidentsError(getApiErrorMessage(residentError, 'Unexpected error while loading residents'))
        }
      } finally {
        if (!isCancelled) {
          setResidentsLoading(false)
        }
      }
    }

    void loadResidents()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [getResidentIds, location])

  useEffect(() => {
    if (!selectedCharacter) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCharacter(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedCharacter])

  const handleCloseCharacterPreview = useCallback(() => {
    setSelectedCharacter(null)
  }, [])

  const handlePreviewModalClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }, [])

  const handleOpenCharacterDetails = useCallback((characterId: number) => {
    navigate(`/characters/${characterId}`)
  }, [navigate])

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

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">Residents</h2>
        {residentsLoading && <SuspenseFallback message="Loading residents..." />}
        {residentsError && <ErrorState message={residentsError} compact />}
        {!residentsLoading && !residentsError && residents.length === 0 && (
          <p className="text-slate-600">No residents found for this location.</p>
        )}
        {!residentsLoading && !residentsError && residents.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {residents.map((resident) => (
              <CharacterCard
                key={resident.id}
                character={resident}
                onOpenDetails={handleOpenCharacterDetails}
                onPreview={setSelectedCharacter}
              />
            ))}
          </div>
        )}
      </section>

      {selectedCharacter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          role="presentation"
          onClick={handleCloseCharacterPreview}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-detail-title"
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={handlePreviewModalClick}
          >
            <img
              className="h-64 w-full object-cover"
              src={selectedCharacter.image}
              alt={selectedCharacter.name}
            />
            <div className="space-y-2 p-5">
              <h2 id="character-detail-title" className="text-2xl font-semibold text-slate-900">
                {selectedCharacter.name}
              </h2>
              <p className="text-slate-600">
                {selectedCharacter.species} - {selectedCharacter.status}
              </p>
              <p className="text-slate-600">Gender: {selectedCharacter.gender}</p>
              <p className="text-slate-600">Location: {selectedCharacter.location.name}</p>
              <button
                type="button"
                onClick={handleCloseCharacterPreview}
                className="mt-3 inline-flex rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                Close
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
