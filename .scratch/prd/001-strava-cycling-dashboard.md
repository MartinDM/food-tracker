# Strava cycling dashboard endpoint

Triage: ready-for-agent

## Problem Statement

The athlete currently has to open Strava and mentally assemble recent cycling performance from individual activities. Strava contains the source data, but it does not provide this dashboard's focused comparison of a recent time window with the immediately preceding matching window in a single, application-friendly response.

The first version must serve one athlete's own data. It should make recent performance and training volume easy to understand without introducing multi-athlete permissions, coaching workflows, or analytics for every sport.

## Solution

Build an authenticated dashboard endpoint for the athlete's cycling Activities. The endpoint accepts a time window and sport type, retrieves data through a hybrid cache-and-refresh model, and returns one dashboard payload containing:

- Summary cards for the requested window.
- Comparable summary values for the previous matching window.
- Trend values showing the change between the two windows.
- A list of recent cycling Activities suitable for rendering in a dashboard.
- Freshness information so the client can tell whether the result came from current or cached Strava data.

The dashboard should read cached data when it is sufficiently current, use an explicit refresh action to fetch newer data from Strava, and fall back to the most recent valid cached snapshot when Strava is unavailable. The athlete should never see another athlete's data.

## User Stories

1. As an athlete, I want to view my recent cycling Activities in one dashboard, so that I do not need to reconstruct my training from separate Strava screens.
2. As an athlete, I want to choose a time window, so that I can inspect the period that matters to me.
3. As an athlete, I want the dashboard to default to a useful recent window, so that it is informative without requiring configuration.
4. As an athlete, I want the dashboard to compare the selected window with the previous matching window, so that I can see whether my recent performance is changing.
5. As an athlete, I want summary values for distance, duration, Activity count, and relevant cycling Effort, so that I can understand both volume and performance.
6. As an athlete, I want Trend values to distinguish increases, decreases, and no meaningful change, so that comparisons are understandable.
7. As an athlete, I want to see the most recent cycling Activities, so that I can inspect the entries behind the Summary.
8. As an athlete, I want each Activity to include the information needed for a concise dashboard row, so that I can identify and compare rides quickly.
9. As an athlete, I want to know when the Dashboard data was last refreshed, so that I can judge its freshness.
10. As an athlete, I want to request a refresh from Strava, so that I can see newly uploaded Activities without waiting for an automatic sync.
11. As an athlete, I want a refresh to report success or failure clearly, so that I know whether the displayed data is current.
12. As an athlete, I want the Dashboard to continue showing the last valid cached data when Strava is temporarily unavailable, so that a provider outage does not erase my view.
13. As an athlete, I want stale or fallback data to be identified clearly, so that I do not mistake it for freshly retrieved data.
14. As an athlete, I want requests to be limited to my own Strava account, so that my personal Activities remain private.
15. As an athlete, I want invalid time windows or unsupported sport types to receive clear validation errors, so that I can correct the request.
16. As an athlete, I want an empty period to return a valid empty Dashboard, so that no-Activity windows are not treated as server failures.
17. As an athlete, I want duplicate or repeated refresh requests to behave predictably, so that the Dashboard does not create inconsistent snapshots.
18. As an athlete, I want the Dashboard to handle partial or missing Strava fields safely, so that one incomplete Activity does not break the entire response.
19. As an athlete, I want the endpoint to return a stable response shape, so that a client can render the Dashboard without provider-specific branching.
20. As an athlete, I want dates, durations, distances, and Effort values to use consistent units and conventions, so that comparisons are meaningful.
21. As an athlete, I want the previous matching window to use the same duration as the requested window, so that the Trend comparison is fair.
22. As an athlete, I want the Dashboard to exclude Activities outside the requested window and sport type, so that Summary values are trustworthy.
23. As an athlete, I want the most recent Activities ordered consistently, so that the list is predictable between requests.
24. As an athlete, I want provider errors to avoid leaking credentials or unnecessary internal details, so that failures remain safe and actionable.
25. As a developer, I want the endpoint to separate the athlete identity, Strava integration, snapshot storage, aggregation, and response mapping concerns, so that each boundary can evolve independently.
26. As a developer, I want refresh behavior to be explicit rather than hidden in every read, so that provider rate limits and latency remain controllable.
27. As a developer, I want the read path to use a cached snapshot when appropriate, so that normal Dashboard requests are fast and resilient.
28. As a developer, I want the refresh path to persist a coherent snapshot, so that readers never observe half-updated Summary data.
29. As a maintainer, I want the endpoint's authorization boundary to derive the athlete from the authenticated request, so that callers cannot select another athlete by changing an identifier.
30. As a maintainer, I want the PRD to define provider, cache, validation, and aggregation failure behavior, so that implementation does not invent inconsistent fallbacks.
31. As a QA engineer, I want tests to exercise the complete Dashboard response at its highest useful seam, so that behavior is validated as the athlete experiences it.
32. As a QA engineer, I want tests for both fresh and cached reads, so that the hybrid data model remains reliable.
33. As a QA engineer, I want tests for successful and failed refreshes, so that recovery and fallback behavior are explicit.
34. As a product owner, I want multi-athlete and non-cycling scope excluded from this release, so that the first version remains focused and deliverable.

## Implementation Decisions

- The first release is an athlete-facing Dashboard for one athlete's own Strava data. It is not a coach, admin, or multi-athlete product.
- Cycling is the primary and only supported sport type for the first release, even though the request contract keeps `sportType` explicit for future extension.
- The endpoint accepts a `timeRange` and `sportType`. The default time range is the most recent seven days; the default sport type is cycling.
- Every requested window is compared with the immediately preceding window of equal duration. The comparison window is derived from the request rather than independently selected.
- The read response contains Summary data, previous-window Summary data, derived Trend data, recent Activity items, and freshness metadata.
- Summary data includes at least Activity count, total distance, total duration, and the cycling Effort fields available consistently from the Strava integration. The implementation must not fabricate values when Strava does not provide a field.
- Activity items contain the stable provider identifier, timestamp, display name or title, distance, duration, and available cycling performance fields needed by the Dashboard. Provider-specific fields are normalized at the response boundary.
- Activities are ordered newest first. The endpoint may cap the number of returned Activity items, but the cap must be explicit and must not change Summary totals.
- The endpoint is read-oriented, with a separate explicit refresh/update operation. A normal read must not implicitly force a Strava fetch on every request.
- The hybrid data model uses a persisted snapshot as the read source when the snapshot meets the freshness policy. A refresh fetches the athlete's relevant Strava Activities, recomputes both comparison windows, and atomically replaces the snapshot.
- If Strava is unavailable during refresh and a prior valid snapshot exists, the refresh reports the provider failure while retaining the prior snapshot for subsequent reads. The response must expose freshness or fallback state rather than silently presenting old data as fresh.
- If no prior snapshot exists and Strava cannot be reached, the endpoint returns an explicit dependency failure; it does not return an empty success-shaped Dashboard.
- Refresh requests must be scoped to the authenticated athlete and must not accept an arbitrary athlete identifier as authority.
- Authentication and Strava authorization must be established before data access. Tokens and provider credentials are never included in responses or logs.
- Input validation rejects unsupported sport types, malformed or impossible time windows, and ranges outside the product's supported limits. Validation failures use the repository's standard error shape once an application framework is selected.
- An empty valid window is a successful response with zero totals, an empty Activity list, and a meaningful freshness state.
- The response contract is provider-independent so the client depends on Dashboard concepts rather than Strava's raw API shape.
- All timestamps and units are normalized consistently at the API boundary. The chosen display timezone and distance/unit convention must be configured deliberately rather than inferred per request.
- Snapshot writes must be coherent: a reader observes either the previous complete snapshot or the new complete snapshot, never a partially refreshed combination of Activities and Summary values.
- The implementation uses a Vite + React + TypeScript frontend and a TypeScript Fastify service. The Fastify service serves the built frontend assets and the API as one deployable service.
- The frontend uses Mantine with a custom light-first theme: neutral surfaces and text, a Strava-inspired orange accent, and accessible semantic states that do not rely on color alone.
- TanStack Query manages server state and refresh lifecycle. A narrow React context may manage shared presentation choices, but fetched Activities and refresh results remain in the query cache.
- The API contract is OpenAPI-first, and the frontend uses generated TanStack Query hooks rather than duplicated handwritten request/response types.
- Strava OAuth is server-side. Provider tokens remain on the server, while the frontend uses an HTTP-only session cookie and never receives Strava credentials.
- Athlete identity, authorization metadata, and complete Dashboard snapshots are persisted in restart-safe SQLite through a typed persistence layer. Snapshot reads and replacements remain behind a repository boundary.
- Runtime configuration uses typed environment validation at server startup. Required Strava credentials, OAuth redirect configuration, session secret, database path, and deployment origin must fail clearly when missing.
- The first UI contains summary cards, trend indicators, a recent Activity list, loading/empty/error states, and an explicit refresh action. Charts are out of scope for v1.
- The frontend must be responsive and keyboard-accessible, with visible focus states, semantic controls, readable contrast, and text or icon cues in addition to color.

## Testing Decisions

- The highest seam is the authenticated Dashboard endpoint and its refresh operation. Tests should exercise requests and externally observable responses rather than private aggregation helpers.
- Endpoint tests should verify authorization scoping, default inputs, valid custom windows, cycling filtering, previous-window calculation, response shape, ordering, normalized units, and empty valid periods.
- Integration tests should cover the read path selecting a sufficiently fresh snapshot and the read path returning an identified stale/fallback snapshot when the provider is unavailable.
- Refresh tests should verify that a successful provider response produces one coherent persisted snapshot covering both comparison windows and that a failed refresh preserves the last valid snapshot.
- Error tests should verify explicit behavior for unauthenticated requests, unsupported sport types, malformed ranges, provider failures without a snapshot, and incomplete provider data.
- Tests should use a Strava integration boundary or provider test fixture rather than real athlete credentials or live Strava calls. External calls must not be required for deterministic test runs.
- Existing endpoint, persistence, authentication, and external-provider integration tests in the repository should be used as prior art once the target application is identified. If no such seams exist, introduce the smallest authenticated endpoint-level seam and provider boundary needed to test the behavior.
- Good tests assert what the athlete receives and what durable state the refresh leaves behind. They should not assert private function names, internal cache implementation, request ordering, or incidental provider payload structure.
- The test suite should include representative scenarios for no Activities, one Activity, multiple Activities across both windows, missing optional Effort fields, duplicate refresh requests, and a provider response containing Activities outside the requested sport or time range.
- A smoke test may verify the deployed endpoint can authenticate and return a valid Dashboard payload, but production tests must not mutate or expose real personal data.

## Out of Scope

- Multi-athlete access, coach views, admin dashboards, invitations, teams, and sharing.
- Support for running, swimming, or arbitrary non-cycling sport types in the first release.
- Goal tracking, training plans, recommendations, workout generation, notifications, and coaching advice.
- Full historical analytics, arbitrary date-range exploration, segment leaderboards, route maps, GPS visualizations, gear management, and social features.
- Automatic background synchronization, webhooks, scheduled jobs, or push notifications. Refresh is explicit in v1.
- Editing, deleting, or writing Activities back to Strava.
- A public unauthenticated endpoint or a response that exposes raw Strava tokens.
- Rich charting or a charting library.
- Perfect reconstruction of every Strava metric. Fields unavailable or inconsistent in the provider data remain absent rather than being guessed.

## Further Notes

The agreed product boundary is intentionally narrow: one authenticated athlete, cycling only, recent performance, explicit refresh, and a resilient hybrid read model. The `sportType` input is retained as a contract seam, but supporting additional sports requires a separate product decision and corresponding domain/test review.

The main architectural trade-off is freshness versus resilience. Live reads provide immediate data but increase latency, provider coupling, and rate-limit risk; cached reads are reliable but can become stale. The hybrid model makes freshness visible and gives the athlete control over when to pay the cost of a Strava refresh.

The choice to persist a complete snapshot and expose fallback state is recorded in ADR 0003. The OpenAPI/client boundary and server-side OAuth boundary are recorded in ADRs 0001 and 0002.
