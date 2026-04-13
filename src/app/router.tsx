import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import SuspenseFallback from '../shared/components/SuspenseFallback'

const CharactersPage = lazy(() => import('../features/characters/CharactersPage'))
const CharacterDetailsPage = lazy(() => import('../features/characters/CharacterDetailsPage'))
const LocationsPage = lazy(() => import('../features/locations/LocationsPage'))
const EpisodesPage = lazy(() => import('../features/episodes/EpisodesPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/characters" replace /> },
      {
        path: 'characters',
        element: (
          <Suspense fallback={<SuspenseFallback message="Loading route..." />}>
            <CharactersPage />
          </Suspense>
        ),
      },
      {
        path: 'characters/:id',
        element: (
          <Suspense fallback={<SuspenseFallback message="Loading route..." />}>
            <CharacterDetailsPage />
          </Suspense>
        ),
      },
      {
        path: 'locations',
        element: (
          <Suspense fallback={<SuspenseFallback message="Loading route..." />}>
            <LocationsPage />
          </Suspense>
        ),
      },
      {
        path: 'episodes',
        element: (
          <Suspense fallback={<SuspenseFallback message="Loading route..." />}>
            <EpisodesPage />
          </Suspense>
        ),
      },
    ],
  },
])
