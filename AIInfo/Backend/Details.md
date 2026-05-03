# Backend Details

## Stack and architecture
- Platform: ASP.NET Core Web API.
- Style: layered architecture close to Clean Architecture.
- Projects:
  - `Domain`
  - `Application`
  - `Infrastructure`
  - `Presentation`
- Main patterns:
  - CQRS with MediatR,
  - Repository + UnitOfWork,
  - DTO mapping + validation pipeline.

## Layer responsibilities
- `Domain`:
  - entities, domain rules, role logic, base exceptions,
  - repository/service abstractions.
- `Application`:
  - commands/queries + handlers,
  - DTO contracts,
  - validation and orchestration of use cases.
- `Infrastructure`:
  - EF Core context and repository implementations,
  - external integrations (storage/web APIs),
  - background services and low-level providers.
- `Presentation`:
  - controllers and endpoint contracts,
  - authentication/authorization setup,
  - swagger and API-level filters.

## Core functional modules
- Auth and user management:
  - register/login,
  - profile update,
  - role management and block/unblock.
- Song domain:
  - songs CRUD,
  - segmented song structure,
  - related entities (chords, patterns).
- Albums and subscriptions:
  - album CRUD,
  - album-song relations,
  - user subscriptions.
- Social feedback:
  - comments and reviews.
- Notifications:
  - unread counters,
  - mark as read and cleanup logic.
- Premium/payment flow:
  - currently demo/stub.
- File/media handling:
  - avatars, covers, audio upload/read via storage integration.

## Important mechanisms
- Authentication:
  - JWT-based auth in API.
- Authorization:
  - role checks (Admin/User/Guest),
  - ownership checks in use cases/controllers.
- Data persistence:
  - PostgreSQL through EF Core,
  - migrations-based schema evolution.
- Reliability:
  - retry behavior in external HTTP calls,
  - background maintenance services.

## Current technical risks to track
- Password hashing hardening and token lifecycle improvements.
- Consistency of error response format across controllers.
- Safe handling of repository save boundaries vs UnitOfWork.
- Naming consistency across entities/contracts.
- Missing automated test coverage.

## Documentation pointers for future write-up
- Describe by "use case -> endpoint -> handler -> domain rule -> persistence".
- Keep one chapter per module: auth, songs, albums, subscriptions, notifications.
- Track security decisions separately (token lifecycle, password hashing, rate limit).
