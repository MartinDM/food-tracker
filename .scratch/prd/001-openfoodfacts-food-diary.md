# Open Food Facts food diary

Triage: ready-for-agent

## Problem Statement

The person logging food wants to record several foods quickly and accurately, but existing web nutrition apps make frequent logging slow and fragmented. A typical flow sends them to a separate search view, requires them to search and save one food at a time, and scopes recent foods to the current meal rather than making one global recent-food list available.

This makes a meal with several foods unnecessarily repetitive. The person cannot search multiple foods into a running list, then enter all of the weights and meal assignments together in one pass. The resulting context switching makes food logging tedious and increases the chance that logging is delayed or abandoned.

Open Food Facts provides a large source of product and nutrition data, but provider data is variable and is not itself a personal diary. The product needs to turn a selected Open Food Facts product and a gram weight into a durable food diary entry that belongs to the authenticated person, a specific meal slot, and a local calendar date.

The person logging food also needs historical continuity. They should be able to revisit past days, correct weights or foods, and understand daily nutrition totals without old entries changing unexpectedly when the provider updates a product.

## Solution

Build a responsive, mobile-first web app for a private food diary centered on a bulk-capture workflow. The person stays on one diary view, searches Open Food Facts with a debounced typeahead, adds multiple products to a running capture list, and then enters weights and meal slots for the whole list before saving.

The app presents today’s diary by default, with fixed breakfast, lunch, dinner, and snacks sections. A global recent-food list is available regardless of the currently selected meal slot. Each capture-list item can be assigned a gram weight and meal slot independently, allowing several foods to be prepared and committed together. Each meal section shows its entries and subtotal; the day shows aggregate nutrition and optional progress toward configured calorie and macro targets.

Search results show a known food-type icon when Open Food Facts metadata supports one, and a `Complete info` marker when the provider record has a barcode, name, brand, image, category, and several numeric nutrient values. This is a metadata-quality cue rather than an independent verification claim. Results use the food name as the action label rather than adding an extra “Add” prefix.

Search is UK-market-only: products must be recorded for the United Kingdom to appear in results. This is a market cue, not a claim about where the food was grown or manufactured.

Search returns results in pages of up to 20. The person can load more results. Exact product names, name prefixes, and category matches are ranked ahead of broader matches, with UK-market products preferred within those groups.

Search ranking should strongly prefer a whole-food result when the query is the product name, and demote prepared or flavoured products where the query is only one word in a longer name. Substring-only matches should receive little weight, so a query such as `apple` does not elevate `pineapple` above actual apple products.

Product names with accents over `a` are excluded from search results to keep the result set aligned with the preferred listing style. Accents over `e`, such as the `é` in `purée`, are allowed.

Known retailer names are presented consistently; `lidl` is displayed as `Lidl` wherever it appears in a result name or brand.

Search results show a compact metadata preview with calories per 100g, calories per explicitly gram-backed named serving, and a truncated list of provider-described quantity or serving units. The preview must not infer conversions.

Products without any numeric micronutrient data are excluded from search and recent-food lists.

Search supports title exclusions with a `-term` operator. For example, `apple -style` searches for apple while filtering out product titles containing `style`.

Search uses a soft preference for simple whole foods. Products whose names/categories and available processing metadata suggest foods such as fruit, vegetables, eggs, meat, fish, legumes, nuts, or seeds are ranked higher, but packaged and prepared products remain available. This is a search heuristic, not a health claim.

When the provider supplies a quantity description such as “medium egg” or “half-tin”, the app may show it as reference information. The app does not convert that description into grams. The editable quantity remains grams unless the provider also supplies an explicit serving size in grams.

Recently used foods are shown globally before a search is entered. They are ranked by frequency over the previous 30 days, with recency as the tie-breaker. Adding a product to the running capture list does not immediately require a weight or meal assignment; the selected products can be completed together. The selected product’s normalized nutrition data and raw provider payload are snapshotted when the entries are committed so historical entries remain stable.

The client is a Vite + React + TypeScript application using Mantine. Supabase provides authentication, Postgres persistence, and Row Level Security. A Supabase Edge Function owns the Open Food Facts search and normalization boundary. The app requires connectivity for searches and writes but preserves an unsaved draft while the form is open.

## User Stories

1. As a person logging food, I want to sign in securely, so that my food diary is private.
2. As a person logging food, I want to remain signed in across normal visits, so that logging food does not require repeated authentication.
3. As a person logging food, I want to sign out, so that I can end access on a shared device.
4. As a person logging food, I want to see today’s diary by default, so that I can log food immediately.
5. As a person logging food, I want to navigate to a past date, so that I can review and correct earlier food diary entries.
6. As a person logging food, I want to see breakfast, lunch, dinner, and snacks as distinct meal slots, so that my day is organized in a familiar way.
7. As a person logging food, I want to search for a food by name without leaving the diary view, so that I do not lose my current context.
8. As a person logging food, I want search results to appear as I type, so that I can select a food without submitting a separate search form.
9. As a person logging food, I want typeahead results to be debounced, so that the app remains responsive and does not issue unnecessary provider requests.
10. As a person logging food, I want search results to show product name and brand, so that I can distinguish similar foods.
11. As a person logging food, I want an available product image in search results, so that I can recognize the correct product quickly.
12. As a person logging food, I want frequently used foods to appear globally before I search, so that common entries take fewer interactions regardless of meal slot.
13. As a person logging food, I want frequently used foods to be ranked from the last 30 days, so that the quick-add list reflects my current habits.
14. As a person logging food, I want ties in frequent-food ranking resolved by most recent use, so that the more recently relevant food appears first.
15. As a person logging food, I want a clear empty-search state, so that I understand how to begin finding food.
16. As a person logging food, I want a clear no-results state, so that I know the provider did not find a matching food.
17. As a person logging food, I want to add a selected Open Food Facts product to a running capture list, so that I can gather several foods before completing their details.
18. As a person logging food, I want to search and add several foods in succession, so that I can capture a complete meal without repeated save-and-return navigation.
19. As a person logging food, I want the running capture list to remain visible while I search, so that I can see what I have already selected.
20. As a person logging food, I want to enter gram weights for all captured foods in one pass, so that I can complete a meal efficiently.
21. As a person logging food, I want to assign a meal slot independently for each captured food, so that one capture list can contain foods for different meal slots.
22. As a person logging food, I want to review every product, weight, and meal slot before committing, so that I can catch mistakes in bulk.
23. As a person logging food, I want to save the complete capture list in one action, so that several food diary entries are persisted together.
24. As a person logging food, I want incomplete capture-list items identified before saving, so that a missing weight cannot create an incorrect entry.
25. As a person logging food, I want to log the same product more than once, so that separate eating occasions or portions remain accurate.
25. As a person logging food, I want nutrition values scaled from Open Food Facts per-100-gram values, so that the displayed totals match the weight I entered.
26. As a person logging food, I want calories and available nutrition values shown for an entry, so that I understand what the recorded food contributes.
27. As a person logging food, I want a stable nutrition summary for common fields, so that meal and daily totals remain understandable.
28. As a person logging food, I want to expand an entry to see additional available Open Food Facts nutrients, so that I can inspect detail without making the main diary overwhelming.
29. As a person logging food, I want missing provider nutrient values shown as unavailable, so that the app does not misrepresent unknown data as zero.
30. As a person logging food, I want the selected product’s nutrition data captured when I log it, so that historical entries do not change silently when Open Food Facts changes.
31. As a person logging food, I want to see a subtotal for each meal slot, so that I can understand the contribution of breakfast, lunch, dinner, and snacks.
32. As a person logging food, I want to see daily nutrition totals, so that I can understand everything logged on a date.
33. As a person logging food, I want daily totals to update when I add, edit, or delete an entry, so that the diary remains trustworthy.
34. As a person logging food, I want to configure an optional daily calorie target, so that I can compare logged calories with my own goal.
35. As a person logging food, I want to configure optional protein, carbohydrate, and fat targets independently, so that I can track only the goals relevant to me.
36. As a person logging food, I want to use the diary without configuring targets, so that goals do not block food logging.
37. As a person logging food, I want to see consumed versus configured targets, so that progress is understandable.
38. As a person logging food, I want progress for an unset target to be omitted rather than treated as zero, so that the dashboard does not imply a goal I did not choose.
39. As a person logging food, I want to edit a saved entry’s weight, so that I can correct an inaccurate portion.
40. As a person logging food, I want to change an entry’s meal slot, so that I can correct where it was recorded.
41. As a person logging food, I want to replace an entry’s selected food, so that I can correct an incorrect product choice.
42. As a person logging food, I want to delete a saved entry, so that accidental records do not remain in my diary.
43. As a person logging food, I want edits to use the stored product snapshot, so that correcting a weight does not unexpectedly change historical product nutrition.
44. As a person logging food, I want past-day entries to remain private, so that only I can inspect my diary history.
45. As a person logging food, I want the app to preserve my current unsaved draft during a temporary navigation or connectivity interruption, so that I do not lose work.
46. As a person logging food, I want clear loading feedback while searching, so that I know the typeahead is working.
47. As a person logging food, I want clear saving feedback, so that I know whether an entry was persisted.
48. As a person logging food, I want clear provider-error feedback, so that I know when search is unavailable and what I can do next.
49. As a person logging food, I want clear database or authentication-error feedback, so that failures are not mistaken for successful logging.
50. As a person logging food, I want the app to work on a phone, so that I can log food during a meal.
51. As a person logging food, I want the typeahead and diary controls to be keyboard accessible, so that I can use the app without a pointer.
52. As a person logging food, I want readable labels, focus states, and non-color status cues, so that the app remains usable with accessibility needs.
53. As a developer, I want Open Food Facts access behind one server-side boundary, so that provider policy and normalization do not leak into the client.
54. As a developer, I want Supabase Row Level Security to enforce diary ownership, so that privacy does not depend only on client behavior.
55. As a developer, I want provider data normalized before it reaches diary workflows, so that variable Open Food Facts payloads do not make the UI unstable.
56. As a developer, I want raw provider nutrition data retained alongside normalized values, so that the app can expose additional nutrients without losing source fidelity.
57. As a developer, I want diary totals computed from durable entry snapshots, so that reads are reproducible and historical data is stable.
58. As a maintainer, I want provider requests to identify the application appropriately and respect Open Food Facts usage guidance, so that the integration is responsible.
59. As a maintainer, I want provider search responses cached or deduplicated where appropriate, so that typeahead does not create unnecessary load.
60. As a QA engineer, I want end-to-end logging scenarios covered, so that the core diary loop is validated through the user-facing surface.

## Implementation Decisions

- The first release is a responsive, mobile-first web app for one authenticated person. The data model uses a user identity even though the initial product is personal, allowing private multi-user accounts without redesigning diary ownership.
- Vite, React, and TypeScript are the frontend stack. Mantine supplies accessible form, combobox, layout, feedback, and responsive UI primitives with a small custom theme.
- Supabase is the primary platform: Auth for identity, Postgres for persistence, and Row Level Security for private diary ownership.
- A Supabase Edge Function is the Open Food Facts integration boundary. The browser does not call Open Food Facts directly.
- The Edge Function accepts a debounced search query, applies the application’s result limit and normalization rules, and returns provider-independent search results containing at least product code, product name, brand when available, image when available, and nutrition data required for selection.
- Open Food Facts results are limited to products found by the provider. Custom foods are not supported in v1.
- The selected product’s raw provider payload and normalized nutrition snapshot are stored when the food diary entry is created. Historical entries do not silently recalculate from later provider changes.
- A food diary entry contains the authenticated person ID, local calendar date, fixed meal slot, Open Food Facts product code, product identity snapshot, nutrition snapshot, gram weight, and created/updated timestamps.
- The primary interaction is a persistent capture list on the diary view. Searching adds products to the list; selecting a product does not force immediate weight entry or persistence.
- Each capture-list item has an independent gram weight, meal slot, and validation state. The person can add, remove, or revise items before committing.
- Bulk commit validates every capture-list item and persists all valid entries atomically. If validation or persistence fails, the app must make the failure explicit and avoid presenting a partial success as complete.
- Meal slots are a fixed enum: breakfast, lunch, dinner, and snacks. Each slot may contain any number of entries.
- The canonical stored quantity is grams. Decimal gram values are allowed. The UI may offer a serving unit only when Open Food Facts provides a serving size with a reliable gram conversion; household measures such as “whole fruit” or “tin” are not offered without a reliable conversion.
- Open Food Facts nutrition values are interpreted from provider units and normalized into a stable internal representation. The application stores raw nutrient data for completeness but only aggregates fields with compatible units.
- The primary nutrition display is raw-plus-curated: the main diary shows stable common values and an expandable panel shows available additional nutrients from the snapshot. Missing values remain unavailable and are never fabricated as zero.
- Food diary reads and writes are performed through typed Supabase data-access functions. TanStack Query manages server state, cache invalidation, search-result caching, and mutation lifecycle; local React state manages the unsaved draft and transient UI choices.
- Recent foods are global across meal slots, deduplicated by Open Food Facts product code, and ranked by count of entries in the previous 30 days, with most recent use as the tie-breaker. A fallback to recent use applies when the person has insufficient 30-day history.
- The diary defaults to the current local calendar date and supports navigation to past dates. The account stores a timezone used to derive local diary dates; timestamps may be stored in UTC.
- The athlete can add, edit, and delete entries for today and past dates. Edits preserve the product nutrition snapshot unless the athlete explicitly replaces the product.
- Daily targets are optional profile settings. Calories, protein, carbohydrates, and fat can each be set independently as one fixed daily target set. Logging never requires targets.
- Daily and meal totals are derived from the saved snapshots and gram weights. Target progress is displayed only for configured targets.
- The app requires connectivity for provider search and Supabase persistence. The current unsaved draft is preserved locally during transient interruptions; full offline logging and synchronization are out of scope.
- The main workflow includes loading, empty, validation, authentication, provider, persistence, bulk-validation, bulk-save-success, and bulk-save-failure states. Error messages must be actionable without exposing provider credentials or internal details.
- The interface must be responsive and keyboard accessible. Status and progress cannot rely on color alone.
- Open Food Facts integration must follow the provider’s current API and usage requirements, including an appropriate identifying User-Agent and responsible request volume.
- The product will not include barcode scanning, recipes, exercise logging, water tracking, reminders, social features, coaching, or public diaries in v1.

## Testing Decisions

- The highest test seam is the authenticated browser workflow: sign in, search/typeahead several foods, keep them in a running capture list, enter weights and meal slots in one pass, bulk-save, observe the entries and totals, then edit and delete them.
- End-to-end tests should use a controlled Open Food Facts provider fixture or Edge Function test double and a disposable Supabase test environment. They must not depend on live provider data or personal credentials.
- The critical happy path should verify that several selected products can receive independent gram weights and meal slots, become durable entries in one bulk action, and update meal and daily totals.
- Search tests should cover staying on the diary view, debouncing behavior at the user-visible level, global recent-food results, provider results, no results, loading, and provider failure.
- Nutrition tests should verify per-100-gram scaling, decimal gram weights, available versus unavailable fields, raw-plus-curated presentation, and stable historical snapshots after provider data changes.
- Diary tests should cover today and past dates, all fixed meal slots, multiple entries in one slot, duplicate product entries, incomplete capture-list validation, atomic bulk save, edit weight, change meal slot, replace product, and delete entry.
- Target tests should cover optional independent targets, consumed-versus-target progress, unset targets, and totals changing after entry mutations.
- Authorization tests should verify that one authenticated person cannot read, modify, or delete another athlete’s entries, relying on Row Level Security at the data boundary rather than only client guards.
- Timezone tests should verify that entries near local midnight remain attached to the correct account-local calendar date.
- Accessibility tests should verify keyboard navigation through the typeahead, visible focus, labels, announcements or equivalent feedback for loading/errors, and non-color cues for target progress and missing data.
- Good tests assert user-visible behavior and durable business outcomes through public interfaces. They should not assert React component internals, Supabase query construction, provider payload field ordering, or private helper names.
- Prior art should follow the repository’s established Vite/React, Mantine, Supabase, TanStack Query, and Playwright patterns once the new project is scaffolded. If no prior art exists, establish one browser-level diary workflow as the reference pattern before adding lower-level coverage.

## Out of Scope

- Barcode scanning.
- Custom foods or manually authored nutrition records.
- Recipes, mixed dishes, meal templates, and saved combinations.
- Exercise, water, supplements, sleep, body-weight tracking, or other health domains.
- Automatic calorie or macro recommendations.
- Variable targets by day of week or date.
- Full offline logging and conflict-resolving synchronization.
- Public diaries, household sharing, coach access, teams, and social features.
- Export, account deletion, provider-data re-import, or bulk diary migration beyond the core same-session capture-list commit in v1.
- Automatic correction of historical entries when Open Food Facts changes.
- A fixed exhaustive nutrient table containing every possible Open Food Facts field in the primary diary view.
- Notifications, reminders, gamification, leaderboards, and coaching advice.
- A commitment to Notion as a persistence layer. Notion may be considered later for reporting or manual administration, but it is not the diary database.

## Further Notes

Supabase is preferred over Notion because this product needs reliable relational persistence, ownership enforcement, date and meal queries, mutation consistency, and typeahead-related data access. The central durable boundary is the food diary entry’s nutrition snapshot: it preserves what the athlete recorded at the time, even if the provider later changes its product data.

The product should use “food diary entry” for a saved weighed food, “meal slot” for breakfast, lunch, dinner, or snacks, and “nutrition snapshot” for the provider data captured at logging time. “Recent foods” describes the quick-add projection over prior entries rather than a separate mutable food catalog.

The first implementation should be delivered as vertical slices. Start with the authenticated diary view and a capture list that can hold multiple products, then add Open Food Facts search, one-pass weights and meal assignment, atomic bulk save, global recent-food ranking, nutrition scaling, targets, and historical editing as independently verifiable capabilities.
