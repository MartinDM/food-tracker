# Commit capture list and calculate nutrition

Triage: ready-for-agent
Type: AFK

## What to build

Commit a fully validated capture list as one atomic operation. Snapshot each selected product's raw and normalized Open Food Facts nutrition data at commit time, scale available nutrients from per-100-gram values to the entered weight, and update meal subtotals and daily totals.

## Acceptance criteria

- [ ] A complete capture list is saved in one user action as durable food diary entries.
- [ ] The bulk operation is atomic: it does not present partial success as complete.
- [ ] Each saved entry stores product identity and raw/normalized nutrition snapshots.
- [ ] Nutrition values scale correctly for decimal gram weights.
- [ ] Missing provider nutrient values remain unavailable and are not fabricated as zero.
- [ ] Meal subtotals and daily totals update after a successful bulk commit.
- [ ] The main view shows curated common nutrition values and an expandable available-nutrients detail.
- [ ] Bulk save success and failure states are clear and actionable.
- [ ] Browser and integration tests cover several products, different meal slots, duplicate products, scaling, missing nutrients, atomic failure, and totals.

## Blocked by

- .scratch/issues/009-build-multi-food-capture-list.md
