# Add comparable time windows and trend summaries

Triage: ready-for-agent
Type: AFK

## What to build

Extend the dashboard request with `timeRange` and `sportType`, defaulting to the recent seven-day cycling window. Derive the immediately preceding equal-length window and return current and previous summaries with trend values in the same dashboard response.

## Acceptance criteria

- [ ] The endpoint accepts a valid time window and sport type while preserving useful defaults.
- [ ] Cycling is supported and Activities outside the requested sport or time window are excluded from the relevant summary.
- [ ] The previous comparison window has exactly the same duration as the requested window and immediately precedes it.
- [ ] The response contains current summary, previous summary, and derived increase/decrease/no-change trend values.
- [ ] Summary totals remain correct regardless of the number of recent Activity items returned.
- [ ] Endpoint-level tests cover default inputs, custom windows, window boundaries, multiple Activities across both windows, and trend calculations.

## Blocked by

- .scratch/issues/001-deliver-authenticated-cycling-dashboard-happy-path.md
