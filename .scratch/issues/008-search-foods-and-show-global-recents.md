# Search foods and show global recents

Triage: ready-for-agent
Type: AFK

## What to build

Add the in-diary food search workflow through a Supabase Edge Function that proxies and normalizes Open Food Facts. The person can type a query without leaving the diary, receive debounced results, and see globally ranked recent foods before searching. Recent foods must be independent of the currently selected meal slot.

## Acceptance criteria

- [ ] The search stays on the diary view and displays debounced Open Food Facts results.
- [ ] Results include product code, name, brand when available, image when available, and normalized nutrition data needed for selection.
- [ ] Results show a known food-type icon when category or packaging metadata supports one, plus a `Complete info` marker when the provider supplies a barcode, name, brand, image, category, and at least four numeric nutrient values. This is a metadata-quality cue, not an independent product verification claim.
- [ ] Results include only products recorded for the United Kingdom and show a clear `UK` cue.
- [ ] Search result labels do not use an `Add` prefix; selecting the result is the action.
- [ ] Search returns up to 20 results per page, supports loading later pages, and ranks exact/name-prefix/category matches ahead of broader matches, with UK-market results preferred.
- [ ] Results use a soft “simple food” preference: products with simple-food names/categories and low-processing metadata are ranked higher, while other results remain available. The cue is heuristic, not a health or nutrition claim.
- [ ] Whole-food exact and token matches rank above prepared/flavoured products, while substring-only matches receive little weight.
- [ ] Results with accents over `a` in the product name are filtered out; accents over `e` remain allowed.
- [ ] The retailer name `lidl` is displayed as `Lidl` wherever it appears in a result name or brand.
- [ ] Each result shows a compact metadata preview for available calories and explicitly provided serving or quantity units without inferred conversions.
- [ ] Results and recent foods without numeric micronutrient data are filtered out.
- [ ] A `-term` search operator excludes results whose product title contains that term, such as `apple -style`.
- [ ] Loading, empty query, no results, and provider failure states are clear and actionable.
- [ ] Open Food Facts requests use the configured identifying User-Agent and do not expose provider credentials.
- [ ] Recent foods are deduplicated globally by product code and ranked by 30-day frequency, then most recent use.
- [ ] Recent foods are available regardless of meal slot.
- [ ] Provider and Edge Function tests cover normalization, responsible request handling, results, no results, and provider failure.

## Blocked by

- .scratch/issues/007-create-private-diary-shell.md
