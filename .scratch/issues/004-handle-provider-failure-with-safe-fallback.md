# Handle provider failure with safe fallback

Triage: ready-for-agent
Type: AFK

## What to build

Make refresh and reads resilient to Strava failures. Preserve the last valid complete snapshot when refresh cannot reach Strava, identify stale or fallback data to the athlete, and return an explicit dependency failure when no valid snapshot exists.

## Acceptance criteria

- [ ] A failed refresh never replaces the last valid snapshot with partial or empty data.
- [ ] A subsequent read can serve the last valid snapshot when Strava is unavailable.
- [ ] Fallback responses identify that the data is stale or provider-fallback data.
- [ ] A refresh failure reports a safe, actionable provider error without exposing credentials or internal details.
- [ ] If no valid snapshot exists, the endpoint returns an explicit dependency failure rather than an empty success response.
- [ ] Tests cover failed refresh with an existing snapshot, failed refresh without a snapshot, and safe error output.

## Blocked by

- .scratch/issues/003-add-cached-reads-and-explicit-refresh-behavior.md
