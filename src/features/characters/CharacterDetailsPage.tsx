import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import ErrorState from '../../shared/components/ErrorState'
import { getApiErrorMessage } from '../../shared/api/httpClient'
import { charactersService, type Character } from './services/charactersService'
import { useAsyncRequest } from '../../shared/hooks/useAsyncRequest'

export default function CharacterDetailsPage() {
  const { id } = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const parsedId = useMemo(() => Number(id), [id])
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0
  const request = useCallback((signal: AbortSignal) => {
    if (!hasValidId) {
      return Promise.reject(new Error('Invalid character id'))
    }

    return charactersService.getCharacterById(parsedId, signal)
  }, [hasValidId, parsedId])

  const { loading, error, retry } = useAsyncRequest({
    request,
    onSuccess: setCharacter,
    onError: () => setCharacter(null),
    getErrorMessage: (err) => hasValidId
      ? getApiErrorMessage(err, 'Unexpected error while loading character')
      : 'Invalid character id',
  })

  if (loading) {
    return <SuspenseFallback message="Loading character details..." />
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link to="/characters" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to characters
        </Link>
        <ErrorState message={error} actionLabel="Try again" onAction={retry} />
      </section>
    )
  }

  if (!character) {
    return (
      <section className="space-y-4">
        <Link to="/characters" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to characters
        </Link>
        <p className="text-slate-600">Character not found.</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <Link to="/characters" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
        Back to characters
      </Link>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <img className="h-80 w-full object-cover" src={character.image} alt={character.name} />
        <div className="space-y-2 p-5">
          <h1 className="text-3xl font-semibold text-slate-900">{character.name}</h1>
          <p className="text-slate-600">
            {character.species} - {character.status}
          </p>
          <p className="text-slate-600">Gender: {character.gender}</p>
          <p className="text-slate-600">Location: {character.location.name}</p>
        </div>
      </article>
    </section>
  )
}
