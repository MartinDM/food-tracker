# Harden bulk diary workflow

Triage: ready-for-agent
Type: AFK

## What to build

Make the bulk-capture diary reliable for normal use. Preserve the in-session capture draft through transient interruptions, make provider/auth/persistence failures explicit, verify ownership at the RLS boundary, and complete the responsive and keyboard-accessible behavior across the search, capture list, save, and diary views.

## Acceptance criteria

- [ ] A transient provider or persistence failure does not falsely report a complete bulk save.
- [ ] The current capture list and unsaved weights can be recovered after a transient navigation or connectivity interruption.
- [ ] Provider, authentication, validation, and persistence errors are actionable and do not expose secrets or internal details.
- [ ] One authenticated person cannot read, change, or delete another person's entries through direct data access.
- [ ] Typeahead, capture-list controls, meal-slot controls, and save actions are keyboard accessible with visible focus.
- [ ] Loading, empty, error, missing-data, and target-progress states communicate meaning without relying on color alone.
- [ ] The full browser regression path covers sign-in, global recents, multi-food bulk capture, atomic save, totals, editing, deletion, and targets.

## Blocked by

- .scratch/issues/010-commit-capture-list-and-calculate-nutrition.md
- .scratch/issues/011-correct-historical-diary-entries.md
- .scratch/issues/012-configure-optional-daily-nutrition-targets.md
