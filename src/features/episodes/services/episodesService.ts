import { httpClient, type HttpClient } from '../../../shared/api/httpClient'

const EPISODE_API_URL = 'https://rickandmortyapi.com/api/episode'

type ApiPaginationInfo = {
  count: number
  pages: number
  next: string | null
  prev: string | null
}

export type Episode = {
  id: number
  name: string
  episode: string
  air_date: string
  characters: string[]
}

export type EpisodeFilters = {
  name?: string
  episode?: string
}

export type EpisodesResponse = {
  info: ApiPaginationInfo
  results: Episode[]
}

export interface EpisodesService {
  getEpisodes(page: number, filters?: EpisodeFilters, signal?: AbortSignal): Promise<EpisodesResponse>
  getEpisodeById(id: number, signal?: AbortSignal): Promise<Episode>
}

export function createEpisodesService(client: HttpClient): EpisodesService {
  return {
    getEpisodes(page, filters = {}, signal) {
      return client.get<EpisodesResponse>(EPISODE_API_URL, {
        page,
        ...filters,
      }, signal)
    },
    getEpisodeById(id, signal) {
      return client.get<Episode>(`${EPISODE_API_URL}/${id}`, undefined, signal)
    },
  }
}

export const episodesService = createEpisodesService(httpClient)
