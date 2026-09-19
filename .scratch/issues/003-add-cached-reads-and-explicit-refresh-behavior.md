# Add cached reads and explicit refresh behavior

Triage: ready-for-agent
Type: AFK

## What to build

Implement the hybrid read model. Normal dashboard reads should use a sufficiently fresh persisted snapshot without calling Strava, while a separate explicit refresh operation fetches newer data, recomputes the dashboard snapshot, and reports the resulting freshness.

## Acceptance criteria

- [ ] A sufficiently fresh snapshot can satisfy a dashboard read without a Strava request.
- [ ] The dashboard response identifies when its data was last refreshed and whether it is current or cached.
- [ ] A separate authenticated refresh operation fetches the athlete's relevant Strava Activities and replaces the complete snapshot.
- [ ] Refresh success returns a usable dashboard result or a clear refresh completion response.
- [ ] Refresh remains scoped to the authenticated athlete.
- [ ] Tests prove fresh cached reads avoid Strava and successful refreshes update durable snapshot state.

## Blocked by

- .scratch/issues/001-deliver-authenticated-cycling-dashboard-happy-path.md
