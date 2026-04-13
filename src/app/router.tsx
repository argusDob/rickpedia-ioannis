import { createBrowserRouter, Navigate } from 'react-router-dom'
import CharactersPage from '../features/characters/CharactersPage'
import EpisodesPage from '../features/episodes/EpisodesPage'
import LocationsPage from '../features/locations/LocationsPage'
import AppLayout from '../layout/AppLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/characters" replace /> },
      { path: 'characters', element: <CharactersPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'episodes', element: <EpisodesPage /> },
    ],
  },
])
