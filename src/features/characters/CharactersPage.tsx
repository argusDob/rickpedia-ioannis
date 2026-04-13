import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CharacterCard from './components/CharacterCard'
import { useCharacters } from './hooks/useCharacters'
import { type Character } from './services/charactersService'
import PaginationControls from '../../shared/components/PaginationControls'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import FilterInput from '../../shared/components/FilterInput'
import ErrorState from '../../shared/components/ErrorState'

export default function CharactersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const parsedPage = Number(searchParams.get('page'))
  const initialPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const initialNameFilter = searchParams.get('name') ?? ''

  const {
    data,
    loading,
    error,
    retry,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nameFilter,
    setNameFilter,
    nextPage,
    prevPage,
  } = useCharacters({ initialPage, initialNameFilter })

  const handleOpenCharacterDetails = useCallback((characterId: number) => {
    navigate(`/characters/${characterId}`)
  }, [navigate])

  const handleCloseCharacterPreview = useCallback(() => {
    setSelectedCharacter(null)
  }, [])

  const handlePreviewModalClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }, [])

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

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Characters</h1>
        <p className="text-slate-600">Browse and explore character information.</p>
      </header>

      <FilterInput
        label="Filter by name"
        value={nameFilter}
        onChange={setNameFilter}
        placeholder="e.g. Rick"
      />

      {loading && <SuspenseFallback message="Loading characters..." />}
      {error && <ErrorState message={error} actionLabel="Try again" onAction={retry} />}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onOpenDetails={handleOpenCharacterDetails}
                onPreview={setSelectedCharacter}
              />
            ))}
          </div>

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
