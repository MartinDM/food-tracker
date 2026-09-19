# Build multi-food capture list

Triage: ready-for-agent
Type: AFK

## What to build

Turn search selections into a persistent in-session capture list on the diary view. The person can search and add multiple foods without saving each one, keep the list visible while searching, handle duplicate products explicitly, enter gram weights, assign meal slots independently, remove items, and review the whole list before committing.

## Acceptance criteria

- [ ] Selecting a search or recent-food result adds it to the running capture list without immediately persisting a diary entry.
- [ ] The person can add several products through successive searches while the capture list remains visible.
- [ ] Each capture-list item has its own product, decimal gram weight, meal slot, remove action, and validation state.
- [ ] Each item can change its product in place while retaining its meal slot and gram quantity.
- [ ] Each item offers grams and, when provider serving-size data includes a gram conversion, a serving unit; saved values are converted to grams.
- [ ] Provider quantity descriptions are shown as reference text only; descriptions without explicit gram conversions never cause guessed weights.
- [ ] Duplicate products can be retained as separate capture-list items.
- [ ] The person can assign different items to breakfast, lunch, dinner, or snacks.
- [ ] Missing or invalid weights and meal assignments are identified before save.
- [ ] The capture list and unsaved weights survive transient navigation or connectivity interruption during the session.
- [ ] Browser-level tests cover multi-food selection, duplicate items, independent weights, meal assignment, review, removal, and validation.

## Blocked by

- .scratch/issues/008-search-foods-and-show-global-recents.md
