# Deliver authenticated cycling dashboard happy path

Triage: ready-for-agent
Type: AFK

## What to build

Deliver the first complete dashboard path for the authenticated athlete. Fetch the athlete's cycling Activities from Strava, persist one complete snapshot, and serve a provider-independent dashboard response containing summary cards and recent Activities.

Use the agreed technology boundary: a Vite + React + TypeScript frontend, Mantine with a custom light-first Strava-inspired orange theme, a TypeScript Fastify service, server-side Strava OAuth with an HTTP-only session cookie, OpenAPI-first generated TanStack Query hooks, and restart-safe SQLite snapshots. The Fastify service serves the built frontend and API as one deployable service.

## Acceptance criteria

- [ ] An authenticated athlete can request the dashboard without supplying an arbitrary athlete identifier.
- [ ] The endpoint retrieves the athlete's cycling Activities from Strava and persists a complete snapshot.
- [ ] The response contains Activity count, total distance, total duration, available cycling Effort, and recent Activities.
- [ ] Recent Activities are ordered newest first and include the stable provider identifier, timestamp, title, distance, duration, and available cycling fields.
- [ ] A reader observes a complete snapshot and never a partially written response.
- [ ] Unauthenticated requests and attempts to access another athlete's data are rejected.
- [ ] Endpoint-level tests cover the successful request and the authorization boundary without live Strava credentials.
- [ ] The frontend renders the response using Mantine summary cards and an Activity list with loading, empty, error, responsive, and keyboard-accessible states.
- [ ] The client uses generated TanStack Query hooks from the OpenAPI contract rather than duplicated handwritten API types.
- [ ] Required runtime configuration is validated at Fastify startup and Strava tokens never reach the browser.

## Blocked by

None - can start immediately.
