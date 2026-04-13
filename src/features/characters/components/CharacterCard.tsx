import type { Character } from '../services/charactersService'

type CharacterCardProps = {
  character: Character
  onOpenDetails: (characterId: number) => void
  onPreview: (character: Character) => void
  onPrefetchDetails: (characterId: number) => void
}

export default function CharacterCard({
  character,
  onOpenDetails,
  onPreview,
  onPrefetchDetails,
}: CharacterCardProps) {
  return (
    <article
      className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <button
        type="button"
        onClick={() => onOpenDetails(character.id)}
        onMouseEnter={() => onPrefetchDetails(character.id)}
        onFocus={() => onPrefetchDetails(character.id)}
        className="w-full text-left"
      >
        <img
          className="h-52 w-full object-cover"
          src={character.image}
          alt={character.name}
          loading="lazy"
          decoding="async"
        />
      </button>
      <div className="space-y-1 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{character.name}</h2>
        <p className="text-sm text-slate-600">
          {character.species} - {character.status}
        </p>
        <p className="text-sm text-slate-600">Gender: {character.gender}</p>
        <p className="text-sm text-slate-600">Location: {character.location.name}</p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenDetails(character.id)}
            className="inline-flex rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Open details
          </button>
          <button
            type="button"
            onClick={() => onPreview(character)}
            className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Preview
          </button>
        </div>
      </div>
    </article>
  )
}
