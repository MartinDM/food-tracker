# Food Diary Context

This context defines the language for a private food diary that makes it fast to capture several foods, assign their weights and meal slots, and review nutrition for a local calendar date.

## Language

**Food diary entry**:
A saved record of one Open Food Facts product, its nutrition snapshot, a gram weight, a local calendar date, and a meal slot.
_Avoid_: food log, item, serving

**Capture list**:
The temporary in-session list of selected products waiting for weights, meal slots, review, and bulk commit.
_Avoid_: cart, queue

**Meal slot**:
One of the fixed diary groups: breakfast, lunch, dinner, or snacks.
_Avoid_: category, occasion

**Nutrition snapshot**:
The raw and normalized Open Food Facts product and nutrient data captured when a food diary entry is committed.
_Avoid_: current nutrition, live product data

**Recent food**:
A product projection ranked from the person's prior food diary entries, globally across meal slots.
_Avoid_: favorite, meal recent

**Bulk commit**:
The single save operation that validates and persists all complete capture-list items atomically.
_Avoid_: batch submit, mass save

**Person**:
The authenticated owner of a private food diary.
_Avoid_: athlete, customer, account
