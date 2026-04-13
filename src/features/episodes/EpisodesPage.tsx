import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEpisodes } from './hooks/useEpisodes'
import CharacterCard from '../characters/components/CharacterCard'
import { charactersService, type Character } from '../characters/services/charactersService'
import FilterInput from '../../shared/components/FilterInput'
import SuspenseFallback from '../../shared/components/SuspenseFallback'
import { useIntersectionObserver } from '../../shared/hooks/useIntersectionObserver'

export default function EpisodesPage() {
  const navigate = useNavigate()
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const [expandedEpisodeIds, setExpandedEpisodeIds] = useState<Set<number>>(new Set())
  const [episodeCharacters, setEpisodeCharacters] = useState<Record<number, Character[]>>({})
  const [loadingCharacterEpisodeIds, setLoadingCharacterEpisodeIds] = useState<Set<number>>(new Set())
  const [characterLoadErrors, setCharacterLoadErrors] = useState<Record<number, string>>({})
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  const {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNextPage,
    nameFilter,
    setNameFilter,
    loadMore,
  } = useEpisodes()

  const setLoadMoreTriggerRef = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: hasNextPage && !loading && !error,
    root: scrollContainer,
    rootMargin: '120px',
  })
  const isInitialLoading = loading && data.length === 0

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

  const getCharacterIdsFromEpisodeUrls = (urls: string[]) =>
    Array.from(new Set(urls
      .map((url) => Number(url.split('/').at(-1)))
      .filter((id) => Number.isInteger(id) && id > 0)))

  const loadEpisodeCharacters = async (episodeId: number, characterUrls: string[]) => {
    if (episodeCharacters[episodeId]) {
      return
    }

    const characterIds = getCharacterIdsFromEpisodeUrls(characterUrls)

    if (characterIds.length === 0) {
      setEpisodeCharacters((currentCharacters) => ({
        ...currentCharacters,
        [episodeId]: [],
      }))
      return
    }

    setLoadingCharacterEpisodeIds((currentIds) => new Set(currentIds).add(episodeId))
    setCharacterLoadErrors((currentErrors) => {
      const { [episodeId]: _removedError, ...rest } = currentErrors
      return rest
    })

    try {
      const characters = await charactersService.getCharactersByIds(characterIds)
      setEpisodeCharacters((currentCharacters) => ({
        ...currentCharacters,
        [episodeId]: characters,
      }))
    } catch (error) {
      setCharacterLoadErrors((currentErrors) => ({
        ...currentErrors,
        [episodeId]: error instanceof Error ? error.message : 'Unexpected error while loading characters',
      }))
    } finally {
      setLoadingCharacterEpisodeIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(episodeId)
        return nextIds
      })
    }
  }

  const toggleEpisodeCharacters = (episodeId: number, characterUrls: string[]) => {
    const isExpanded = expandedEpisodeIds.has(episodeId)

    setExpandedEpisodeIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (isExpanded) {
        nextIds.delete(episodeId)
      } else {
        nextIds.add(episodeId)
      }

      return nextIds
    })

    if (!isExpanded && !episodeCharacters[episodeId] && !loadingCharacterEpisodeIds.has(episodeId)) {
      void loadEpisodeCharacters(episodeId, characterUrls)
    }
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Episodes</h1>
        <p className="text-slate-600">View episode summaries and details.</p>
      </header>

      <FilterInput
        label="Filter by name"
        value={nameFilter}
        onChange={setNameFilter}
        placeholder="e.g. Pilot"
      />

      {isInitialLoading && <SuspenseFallback message="Loading episodes..." />}
      {error && <p className="text-red-600">{error}</p>}

      {!error && !isInitialLoading && (
        <div ref={setScrollContainer} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <ul className="space-y-3">
            {data.map((episode) => (
              <li key={episode.id} className="rounded-md border border-slate-200 bg-white p-4">
                <button
                  type="button"
                  onClick={() => navigate(`/episodes/${episode.id}`)}
                  className="text-left text-lg font-semibold text-slate-900 transition hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  {episode.name}
                </button>
                <p className="text-sm text-slate-600">{episode.episode}</p>
                <p className="text-sm text-slate-600">Aired: {episode.air_date}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => toggleEpisodeCharacters(episode.id, episode.characters)}
                    className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {expandedEpisodeIds.has(episode.id) ? 'Hide characters' : 'Show characters'}
                  </button>
                </div>

                {expandedEpisodeIds.has(episode.id) && (
                  <div className="mt-4 space-y-3">
                    {loadingCharacterEpisodeIds.has(episode.id) && (
                      <SuspenseFallback message="Loading characters..." />
                    )}

                    {characterLoadErrors[episode.id] && (
                      <p className="text-sm text-red-600">{characterLoadErrors[episode.id]}</p>
                    )}

                    {!loadingCharacterEpisodeIds.has(episode.id) &&
                      !characterLoadErrors[episode.id] &&
                      (episodeCharacters[episode.id]?.length ?? 0) === 0 && (
                      <p className="text-sm text-slate-600">No characters found for this episode.</p>
                    )}

                    {(episodeCharacters[episode.id]?.length ?? 0) > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {episodeCharacters[episode.id].map((character) => (
                          <CharacterCard
                            key={character.id}
                            character={character}
                            onOpenDetails={(characterId) => navigate(`/characters/${characterId}`)}
                            onPreview={setSelectedCharacter}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Loaded {data.length} episodes (page {page} of {totalPages})
            </p>
            {!hasNextPage && <p className="text-sm text-slate-600">You reached the end.</p>}
          </div>
          {hasNextPage && <div ref={setLoadMoreTriggerRef} aria-hidden className="h-1 w-full" />}
          {loading && <SuspenseFallback message="Loading more episodes..." />}
        </div>
      )}

      {selectedCharacter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          role="presentation"
          onClick={() => setSelectedCharacter(null)}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-detail-title"
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
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
                onClick={() => setSelectedCharacter(null)}
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
