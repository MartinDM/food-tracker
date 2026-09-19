# Harden request validation and data normalization

Triage: ready-for-agent
Type: AFK

## What to build

Harden the dashboard contract at its request and provider boundaries. Reject invalid windows and unsupported sport types, normalize timestamps and units consistently, handle empty valid periods, and tolerate missing optional cycling Effort fields without fabricating values.

## Acceptance criteria

- [ ] Malformed, impossible, or out-of-bounds time windows receive the repository-standard validation error.
- [ ] Unsupported sport types receive the repository-standard validation error.
- [ ] A valid period with no Activities returns a successful response with zero totals and an empty Activity list.
- [ ] Activities with missing optional Effort fields do not break the complete response and do not receive guessed values.
- [ ] Timestamps, durations, distances, and Effort values use documented consistent units and conventions.
- [ ] Activities outside the requested sport or time range cannot affect the returned Summary.
- [ ] Tests cover validation failures, empty periods, missing optional fields, boundary timestamps, and normalized output.

## Blocked by

- .scratch/issues/002-add-comparable-time-windows-and-trend-summaries.md
- .scratch/issues/004-handle-provider-failure-with-safe-fallback.md
