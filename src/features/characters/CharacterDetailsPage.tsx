import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import { isAbortError } from '../../shared/api/httpClient'
import { charactersService, type Character } from './services/charactersService'

export default function CharacterDetailsPage() {
  const { id } = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const parsedId = Number(id)

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setCharacter(null)
      setLoading(false)
      setError('Invalid character id')
      return
    }

    const abortController = new AbortController()
    let isCancelled = false

    async function loadCharacter() {
      try {
        setLoading(true)
        setError(null)
        const response = await charactersService.getCharacterById(parsedId, abortController.signal)

        if (isCancelled) {
          return
        }

        setCharacter(response)
      } catch (err) {
        if (isCancelled || isAbortError(err)) {
          return
        }

        setCharacter(null)
        setError(err instanceof Error ? err.message : 'Unexpected error while loading character')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadCharacter()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [id])

  if (loading) {
    return <SuspenseFallback message="Loading character details..." />
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link to="/characters" className="inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800">
          Back to characters
        </Link>
        <p className="text-red-600">{error}</p>
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
