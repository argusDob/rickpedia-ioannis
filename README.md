# Rickpedia

## Deployed app

- [Rickpedia Live](https://argusdob.github.io/rickpedia-ioannis/characters)

## Implemented performance optimizations

- **Debounced filtering (500ms):** Queries for Characters, Episodes, and Locations are sent only after the user pauses typing, reducing unnecessary requests.
- **Request cancellation with `AbortController`:** Each new request cancels the previous one in list/detail screens to prevent race conditions and unnecessary network/UI work.
- **In-memory TTL cache with entry limits:** A shared cache layer with expiry (`ttlMs`) and `maxEntries` avoids repeated API calls for the same data.
- **Fewer re-renders through memoization:** Components such as `CharacterCard`, `FilterInput`, and `PaginationControls` are memoized, and key handlers are wrapped with `useCallback` for stable props.
- **Lazy image loading:** Cards use `loading="lazy"` and `decoding="async"` to reduce initial render cost and improve list loading smoothness.
- **Infinite scroll for episodes:** `IntersectionObserver` is used for progressive page loading instead of eager bulk loading.
- **Route-level code splitting with dynamic imports:** Router pages are loaded lazily with dynamic imports so users download only the code needed for the current route.
- **On-demand episode character loading:** Characters for each episode are fetched only when the related section is expanded.
- **ID deduplication before batch fetch:** Character IDs are deduplicated with `Set` before calling `getCharactersByIds`, avoiding duplicate fetches.
- **Client-side paging optimization for Locations:** The app fetches API pages of 20 items and presents UI pages of 10 via slicing, reducing remote request frequency.
- **URL state sync with smart updates:** Query params are updated only when `page` or `name` actually changes, avoiding unnecessary navigations/renders.

## Architecture

- **Feature-first structure:** The app is organized by domain under `src/features` (`characters`, `episodes`, `locations`), each owning its pages, hooks, services, and UI pieces.
- **Page + hook separation:** Pages handle rendering and interactions, while custom hooks (`useCharacters`, `useEpisodes`, `useLocations`) manage data fetching, pagination, filtering, and UI state.
- **Service layer for API access:** Feature services encapsulate endpoint logic and data mapping, keeping network details out of components.
- **Shared application layer:** Reusable concerns live in `src/shared` (HTTP client, cache utilities, common components, and generic hooks).
- **App shell/layout layer:** Global layout elements (for example `Header`) are isolated in `src/layout` to keep navigation and shell concerns centralized.
- **Routing and code splitting:** Route screens are lazy-loaded with dynamic imports, enabling route-level bundle splitting and faster initial load.

## Testing (Vitest)

- **Test runner:** The project uses `Vitest` (`npm run test`, `npm run test:watch`) with Testing Library and `jsdom` for UI/component testing.
- **Episodes hook behavior (`useEpisodes.test.ts`):** Verifies infinite-scroll pagination behavior, appending new pages on `loadMore`, and preventing extra requests when already at the last page.
- **Characters service caching (`charactersService.test.ts`):** Verifies cache reuse for repeated `getCharacterById` calls, in-flight request deduplication, and ordered/deduplicated results in `getCharactersByIds`.
- **Pagination UI (`PaginationControls.test.tsx`):** Verifies page label rendering, click handler wiring (`Previous`/`Next`), and disabled button states at boundaries.
- **Episodes page integration (`EpisodesPage.test.tsx`):** Verifies that the intersection observer trigger invokes `loadMore`, covering the infinite scroll integration path.

