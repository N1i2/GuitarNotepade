# Frontend Details

## Stack and architecture
- Framework: Next.js (App Router) + React + TypeScript.
- UI styling: Tailwind CSS + reusable UI components.
- App style: client-oriented web app with authenticated and guest flows.

## Routing and composition
- Route groups include:
  - auth pages (login/register),
  - home area with domain pages (songs/chords/patterns/albums/profile/etc.).
- Global layout composes:
  - theme provider,
  - auth provider,
  - shared header/navigation,
  - toast/error feedback provider.

## State management
- Global auth state:
  - context provider + token/session handling.
- Feature-local state:
  - song creation/edit flows,
  - table editor state for song segments.
- Draft preservation:
  - local/session persistence mechanisms (target is backend autosave extension).

## API integration model
- Dedicated API client wrapper for requests and normalized errors.
- Domain service files split by module:
  - auth,
  - songs,
  - chords,
  - patterns,
  - albums,
  - profile,
  - subscriptions,
  - notifications,
  - reviews,
  - payments.
- Direction: keep all network calls centralized in API layer.

## Core user functionality
- Authentication and registration.
- Browse/search/filter of songs, chords, patterns, albums.
- Song details and song editor flows.
- Create/edit entities where role allows it.
- Subscriptions and notifications flow.
- Premium upgrade demo flow.
- Profile and avatar management.

## Important mechanisms
- User feedback:
  - toast notifications for API and action states.
- Validation:
  - mixed model (schema-based + manual checks), target is unification.
- Access control in UI:
  - partial route/content restriction based on auth/role state.
- Internationalization target:
  - RU/EN switch + default language strategy.

## Current technical risks to track
- Security of token storage and auth guard consistency.
- Large page components with mixed responsibilities.
- Inconsistent fetch patterns outside centralized API layer.
- No automated test baseline.
- Potential performance bottlenecks in list filtering/loading strategy.

## Documentation pointers for future write-up
- Describe by "screen -> user action -> API call -> server response -> UI state update".
- Maintain role matrix (Guest/User/Premium/Admin) for each page/action.
- Separate UX chapter: loading/error/empty states and accessibility baseline.
