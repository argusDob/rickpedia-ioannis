import { httpClient, type HttpClient } from '../../../shared/api/httpClient'

const LOCATION_API_URL = 'https://rickandmortyapi.com/api/location'

type ApiPaginationInfo = {
  count: number
  pages: number
  next: string | null
  prev: string | null
}

export type Location = {
  id: number
  name: string
  type: string
  dimension: string
  residents: string[]
}

export type LocationFilters = {
  name?: string
  type?: string
  dimension?: string
}

export type LocationsResponse = {
  info: ApiPaginationInfo
  results: Location[]
}

export interface LocationsService {
  getLocations(page: number, filters?: LocationFilters, signal?: AbortSignal): Promise<LocationsResponse>
  getLocationById(id: number, signal?: AbortSignal): Promise<Location>
}

export function createLocationsService(client: HttpClient): LocationsService {
  return {
    getLocations(page, filters = {}, signal) {
      return client.get<LocationsResponse>(LOCATION_API_URL, {
        page,
        ...filters,
      }, signal)
    },
    getLocationById(id, signal) {
      return client.get<Location>(`${LOCATION_API_URL}/${id}`, undefined, signal)
    },
  }
}

export const locationsService = createLocationsService(httpClient)
