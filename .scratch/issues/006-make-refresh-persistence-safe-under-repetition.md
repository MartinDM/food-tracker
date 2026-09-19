# Make refresh persistence safe under repetition

Triage: ready-for-agent
Type: AFK

## What to build

Make explicit refresh safe when requests are repeated or overlap. Ensure refresh writes are coherent and that readers observe either the previous complete snapshot or the new complete snapshot, never a partially refreshed combination of Activities and summaries.

## Acceptance criteria

- [ ] Repeated refresh requests produce deterministic, coherent dashboard state.
- [ ] Overlapping refreshes cannot expose partial Activities, summaries, or freshness metadata.
- [ ] A failed refresh cannot overwrite a valid snapshot produced by a successful refresh.
- [ ] Readers remain able to serve the last complete snapshot while a refresh is in progress, according to the chosen storage behavior.
- [ ] Tests cover duplicate refreshes, overlapping refreshes, success/failure races, and atomic snapshot visibility.

## Blocked by

- .scratch/issues/003-add-cached-reads-and-explicit-refresh-behavior.md
