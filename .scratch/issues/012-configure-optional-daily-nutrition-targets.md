# Configure optional daily nutrition targets

Triage: ready-for-agent
Type: AFK

## What to build

Add one optional fixed daily target set for calories, protein, carbohydrates, and fat. Each target is independently configurable, and the diary shows consumed-versus-target progress only for fields the person has configured.

## Acceptance criteria

- [ ] The person can configure, update, and clear calorie, protein, carbohydrate, and fat targets independently.
- [ ] Logging food remains possible when no targets are configured.
- [ ] The diary shows consumed-versus-target progress for configured targets only.
- [ ] Unset targets are omitted rather than treated as zero.
- [ ] Target settings remain private to the authenticated person.
- [ ] Browser-level tests cover no targets, partial targets, complete targets, and totals changing after entry mutations.

## Blocked by

- .scratch/issues/010-commit-capture-list-and-calculate-nutrition.md
