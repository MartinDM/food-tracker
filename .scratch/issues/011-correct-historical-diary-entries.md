# Correct historical diary entries

Triage: ready-for-agent
Type: AFK

## What to build

Allow the person to navigate between today and past local calendar dates and correct saved food diary entries. They can edit a weight, move an entry between meal slots, replace the selected product, or delete an entry while preserving nutrition snapshots unless the product is deliberately replaced.

## Acceptance criteria

- [ ] The person can navigate to a past diary date and see its entries grouped by fixed meal slot.
- [ ] Editing a weight recalculates the entry and affected meal/day totals from the stored nutrition snapshot.
- [ ] Moving an entry changes its meal subtotal without changing its product snapshot.
- [ ] Replacing a product records the new product and nutrition snapshot intentionally.
- [ ] Product replacement uses the existing food search and is explicit, so the saved entry receives the replacement's nutrition snapshot.
- [ ] Deleting an entry removes it from the diary and recalculates totals.
- [ ] Historical entries remain private under Row Level Security.
- [ ] Browser-level tests cover past dates, edit weight, move meal slot, replace product, delete, and recalculated totals.

## Blocked by

- .scratch/issues/010-commit-capture-list-and-calculate-nutrition.md
