import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Alert,
  AppShell,
  Badge,
  Button,
  Card,
  Container,
  Group,
  MantineProvider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { Session } from '@supabase/supabase-js';
import { createSupabaseClient, type Database } from './lib/supabase';
import {
  deleteDiaryEntry,
  getDiaryEntries,
  getLocalDiaryDate,
  MEAL_SLOTS,
  mealSlotLabel,
  shiftDiaryDate,
  updateDiaryEntry,
  type DiaryEntry,
} from './lib/diary';
import {
  getRecentFoods,
  searchFoods,
  type FoodSearchResult,
} from './lib/foods';
import {
  createCaptureItem,
  gramsForCapture,
  loadCaptureItems,
  saveCaptureItems,
  type CaptureItem,
  validateCaptureItem,
} from './lib/capture';
import { commitCaptureItems } from './lib/commit';
import {
  formatNutrition,
  scaleNutrition,
  nutritionForCapture,
  sumNutrition,
} from './lib/nutrition';
import '@mantine/core/styles.css';
import './styles.css';

const supabase = createSupabaseClient();

function SignIn({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendMagicLink() {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });
    setMessage(error ? error.message : 'Check your email for a sign-in link.');
    setBusy(false);
  }

  if (!supabase)
    return (
      <Alert color="orange" title="Supabase is not configured">
        Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your local
        environment, then restart Vite.
      </Alert>
    );

  return (
    <Card withBorder maw={460} mx="auto" mt="xl" p="xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMagicLink();
        }}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Private food diary
          </Text>
          <Title order={1}>Log food without the busywork.</Title>
          <Text c="dimmed">
            Sign in to keep your diary private across devices.
          </Text>
          <input
            aria-label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <Button type="submit" loading={busy}>
            Email me a sign-in link
          </Button>
          {message && <Text size="sm">{message}</Text>}
        </Stack>
      </form>
    </Card>
  );
}

const foodTypePresentation: Record<
  NonNullable<FoodSearchResult['foodType']>,
  { icon: string; label: string }
> = {
  fruit: { icon: '🍎', label: 'Fruit' },
  meat: { icon: '🥩', label: 'Meat or fish' },
  dairy: { icon: '🥛', label: 'Dairy' },
  packaged: { icon: '🥫', label: 'Packaged food' },
  drink: { icon: '🥤', label: 'Drink' },
  sweets: { icon: '🍬', label: 'Sweets' },
  food: { icon: '🍽️', label: 'Food' },
};

function displayFoodName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  const normalised =
    trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase()
      ? trimmed.toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
      : trimmed;
  return normalised.replace(/\blidl\b/gi, 'Lidl');
}

function friendlyDiaryDate(date: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}

function FoodResultLabel({ food }: { food: FoodSearchResult }) {
  const presentation = foodTypePresentation[food.foodType ?? 'food'];
  return (
    <Group gap="xs" wrap="nowrap">
      <span role="img" aria-label={presentation.label}>
        {presentation.icon}
      </span>
      <span>
        {displayFoodName(food.name)}
        {food.brand ? ` · ${displayFoodName(food.brand)}` : ''}
      </span>
      {food.wholeFood && (
        <Badge
          title="Ranked higher because the product metadata suggests a simple food"
          size="sm"
          color="grape"
          variant="light"
        >
          Simple food
        </Badge>
      )}
      {food.metadataQuality === 'complete' && (
        <Badge
          title="Complete product information from Open Food Facts"
          size="sm"
          color="teal"
          variant="light"
        >
          ✓ Complete info
        </Badge>
      )}
    </Group>
  );
}

function FoodResultMetadata({ food }: { food: FoodSearchResult }) {
  const calories = food.nutritionPer100g.calories;
  const nutrition =
    typeof calories === 'number' && Number.isFinite(calories)
      ? [`${Math.round(calories)} kcal/100g`]
      : [];
  if (
    food.servingOption &&
    typeof calories === 'number' &&
    Number.isFinite(calories)
  ) {
    nutrition.push(
      `${Math.round((calories * food.servingOption.grams) / 100)} kcal/${food.servingOption.label}`,
    );
  }
  const units = [
    food.servingOption &&
      `${food.servingOption.label} (${food.servingOption.grams}g)`,
    food.quantityDescription,
  ]
    .filter(
      (value, index, values): value is string =>
        Boolean(value) && values.indexOf(value) === index,
    )
    .join(' · ');
  const text = [...nutrition, units].filter(Boolean).join(' · ');
  if (!text) return null;
  return (
    <Text size="xs" c="dimmed" className="food-result-metadata" title={text}>
      {text}
    </Text>
  );
}

const macroNutrientKeys = new Set([
  'energy-kcal_100g',
  'proteins_100g',
  'carbohydrates_100g',
  'fat_100g',
]);

function nutrientLabel(key: string): string {
  return key
    .replace(/_100g$/, '')
    .replace(/-/, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function micronutrientUnit(key: string): string {
  if (key.endsWith('_100g')) return 'g';
  return '';
}

function AddedFoodNutrition({ item }: { item: CaptureItem }) {
  const validation = validateCaptureItem(item);
  if (!validation.valid) return null;
  const grams = nutritionForCapture(item);
  const factor = gramsForCapture(item) / 100;
  const micronutrients = Object.entries(item.food.rawNutrition ?? {})
    .filter(
      ([key, value]) =>
        key.endsWith('_100g') &&
        !macroNutrientKeys.has(key) &&
        typeof value === 'number' &&
        Number.isFinite(value),
    )
    .map(
      ([key, value]) =>
        `${nutrientLabel(key)}: ${((value as number) * factor).toFixed(1)} ${micronutrientUnit(key)}`,
    );
  return (
    <Stack gap={2} mt="xs">
      <Text size="sm" c="dimmed">
        {formatNutrition(grams.calories, ' kcal')} ·{' '}
        {formatNutrition(grams.protein, ' g protein')} ·{' '}
        {formatNutrition(grams.carbohydrates, ' g carbs')} ·{' '}
        {formatNutrition(grams.fat, ' g fat')}
      </Text>
      {micronutrients.length > 0 && (
        <details>
          <summary className="nutrition-details-summary">
            Show micronutrients ({micronutrients.length})
          </summary>
          <Text size="xs" c="dimmed" mt={4}>
            {micronutrients.join(' · ')}
          </Text>
        </details>
      )}
    </Stack>
  );
}

function MacroSplit({ entries }: { entries: DiaryEntry[] }) {
  const totals = entries.reduce(
    (result, entry) => {
      const nutrition = scaleNutrition(entry.nutrition_per_100g, entry.grams);
      return {
        calories: result.calories + (nutrition.calories ?? 0),
        protein: result.protein + (nutrition.protein ?? 0) * 4,
        carbohydrates:
          result.carbohydrates + (nutrition.carbohydrates ?? 0) * 4,
        fat: result.fat + (nutrition.fat ?? 0) * 9,
      };
    },
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );
  const total = totals.protein + totals.carbohydrates + totals.fat;
  if (total <= 0) return null;
  const macros = [
    {
      key: 'protein',
      label: 'Protein',
      color: 'macro-protein',
      calories: totals.protein,
    },
    {
      key: 'carbohydrates',
      label: 'Carbs',
      color: 'macro-carbohydrates',
      calories: totals.carbohydrates,
    },
    { key: 'fat', label: 'Fat', color: 'macro-fat', calories: totals.fat },
  ];
  return (
    <Card withBorder mb="xl">
      <Group justify="space-between">
        <Text fw={600}>Macro split</Text>
        <Text fw={600}>{Math.round(totals.calories)} kcal</Text>
      </Group>
      <div className="macro-bar" aria-label="Macro split by calorie percentage">
        {macros.map((macro) => (
          <div
            key={macro.key}
            className={`macro-bar-segment ${macro.color}`}
            style={{ width: `${(macro.calories / total) * 100}%` }}
            title={`${macro.label}: ${Math.round((macro.calories / total) * 100)}%`}
          />
        ))}
      </div>
      <Group gap="md" mt="xs">
        {macros.map((macro) => (
          <Text key={macro.key} size="xs" c="dimmed">
            <span className={`macro-dot ${macro.color}`} />
            {macro.label} {Math.round((macro.calories / total) * 100)}%
          </Text>
        ))}
      </Group>
    </Card>
  );
}

function Diary({ session }: { session: Session }) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = getLocalDiaryDate(timezone);
  const [date, setDate] = useState(today);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showRecentFoods, setShowRecentFoods] = useState(false);
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureItems, setCaptureItems] = useState<CaptureItem[]>(() =>
    loadCaptureItems(),
  );
  const [editingCaptureId, setEditingCaptureId] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const [replacingEntryId, setReplacingEntryId] = useState<string | null>(null);
  useEffect(() => saveCaptureItems(captureItems), [captureItems]);
  useEffect(() => {
    if (replacingEntryId || editingCaptureId)
      searchInputRef.current?.focus({ preventScroll: true });
  }, [replacingEntryId, editingCaptureId]);
  useEffect(() => {
    if (!supabase) return;
    void getRecentFoods(supabase)
      .then(setRecentFoods)
      .catch(() => setError('Recent foods are temporarily unavailable.'));
  }, []);
  async function refreshEntries() {
    if (!supabase) return;
    try {
      setEntries(await getDiaryEntries(supabase, session.user.id, date));
    } catch {
      setError('Diary entries are temporarily unavailable.');
    }
  }
  useEffect(() => {
    void refreshEntries();
  }, [date, session.user.id]);
  async function editEntry(
    entry: DiaryEntry,
    update: Database['public']['Tables']['diary_entries']['Update'],
  ) {
    if (!supabase) return;
    try {
      await updateDiaryEntry(supabase, entry.id, update);
      setEntryMessage('Entry updated.');
      await refreshEntries();
    } catch {
      setEntryMessage('Could not update this entry.');
    }
  }
  async function removeEntry(entry: DiaryEntry) {
    if (!supabase) return;
    try {
      await deleteDiaryEntry(supabase, entry.id);
      setEntryMessage('Entry deleted.');
      await refreshEntries();
    } catch {
      setEntryMessage('Could not delete this entry.');
    }
  }
  async function replaceEntry(entry: DiaryEntry, food: FoodSearchResult) {
    if (!supabase) return;
    try {
      await updateDiaryEntry(supabase, entry.id, {
        product_code: food.productCode,
        product_name: displayFoodName(food.name),
        brand: food.brand ? displayFoodName(food.brand) : null,
        image_url: food.imageUrl ?? null,
        nutrition_per_100g: food.nutritionPer100g,
        raw_nutrition: food.rawNutrition ?? {},
      });
      setEntries((current) =>
        current.map((candidate) =>
          candidate.id === entry.id
            ? {
                ...candidate,
                product_code: food.productCode,
                product_name: displayFoodName(food.name),
                brand: food.brand ? displayFoodName(food.brand) : null,
                image_url: food.imageUrl ?? null,
                nutrition_per_100g: food.nutritionPer100g,
                raw_nutrition: food.rawNutrition ?? {},
              }
            : candidate,
        ),
      );
      setReplacingEntryId(null);
      setQuery('');
      setResults([]);
      setEntryMessage('Entry replaced and nutrition updated.');
      await refreshEntries();
    } catch {
      setEntryMessage('Could not replace this entry.');
    }
  }
  useEffect(() => {
    if (!supabase || query.trim().length < 2) {
      setResults([]);
      setSearchPage(1);
      setHasMoreResults(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);
      void searchFoods(supabase, query)
        .then((page) => {
          const recentCodes = new Set(
            recentFoods.map((food) => food.productCode),
          );
          const search = query.trim().toLowerCase();

          const recentMatches = recentFoods.filter(
            (food) =>
              food.name.toLowerCase().includes(search) ||
              food.brand?.toLowerCase().includes(search),
          );

          const otherResults = page.results.filter(
            (food) => !recentCodes.has(food.productCode),
          );

          setResults([...recentMatches, ...otherResults]);
          setSearchPage(page.page);
        })
        .catch(() => setError('Food search is temporarily unavailable.'))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  async function loadMoreResults() {
    if (!supabase || !query.trim() || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = await searchFoods(supabase, query, searchPage + 1);
      setResults((current) => {
        const seen = new Set(current.map((food) => food.productCode));
        return [
          ...current,
          ...nextPage.results.filter((food) => !seen.has(food.productCode)),
        ];
      });
      setSearchPage(nextPage.page);
      setHasMoreResults(nextPage.hasMore);
    } catch {
      setError('More food results are temporarily unavailable.');
    } finally {
      setLoadingMore(false);
    }
  }
  const visibleFoods =
    query.trim().length >= 2 ? results : showRecentFoods ? recentFoods : [];
  function addFood(food: FoodSearchResult) {
    if (editingCaptureId) {
      setCaptureItems((items) =>
        items.map((item) => {
          if (item.id !== editingCaptureId) return item;
          const grams = gramsForCapture(item);
          return {
            ...item,
            food,
            amount: Number.isFinite(grams) && grams > 0 ? grams.toFixed(2) : '',
            unit: 'g',
          };
        }),
      );
      setEditingCaptureId(null);
      setQuery('');
      setResults([]);
      setReviewed(false);
      return;
    }
    setCaptureItems((items) => [...items, createCaptureItem(food)]);
    setQuery('');
    setResults([]);
    setReviewed(false);
  }
  function updateItem(
    id: string,
    update: Partial<Pick<CaptureItem, 'amount' | 'unit' | 'mealSlot'>>,
  ) {
    setCaptureItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
    setReviewed(false);
  }
  const invalidItems = captureItems.filter(
    (item) => !validateCaptureItem(item).valid,
  );
  const dailyTotals = sumNutrition(
    captureItems
      .filter((item) => validateCaptureItem(item).valid)
      .map(nutritionForCapture),
  );
  async function saveCapture() {
    if (!supabase || invalidItems.length > 0 || captureItems.length === 0) {
      setReviewed(true);
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await commitCaptureItems(supabase, session.user.id, date, captureItems);
      setCaptureItems([]);
      setReviewed(false);
      setSaveMessage('Saved all foods to your diary.');
      await refreshEntries();
    } catch {
      setSaveMessage('Nothing was saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Text size="sm" c="orange" fw={700}>
            FOOD DIARY
          </Text>
          <Title order={1}>
            {date === today ? 'Today' : friendlyDiaryDate(date, timezone)}
          </Title>
        </div>
        <Group>
          <Button
            variant="default"
            onClick={() => setDate(shiftDiaryDate(date, -1))}
          >
            Previous day
          </Button>
          <Button
            variant="subtle"
            disabled={date === today}
            onClick={() => setDate(today)}
          >
            Today
          </Button>
          <Button
            variant="default"
            disabled={date === today}
            onClick={() => setDate(shiftDiaryDate(date, 1))}
          >
            Next day
          </Button>
        </Group>
      </Group>
      <MacroSplit entries={entries} />
      <Card withBorder mb="xl" className="search-section">
        <Text fw={600}>Capture list</Text>
        <Text size="sm" c="dimmed" mt="xs">
          Search foods here, add several to a running list, then enter weights
          and meal slots together.
        </Text>
        <Group gap="xs" align="flex-end">
          <input
            ref={searchInputRef}
            aria-label="Search foods"
            placeholder={
              replacingEntryId
                ? 'Search to update this food...'
                : editingCaptureId
                  ? 'Search for a different food...'
                  : 'Search foods...'
            }
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {query && (
            <Button
              variant="subtle"
              size="compact-sm"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              Clear
            </Button>
          )}
        </Group>
        {!query && recentFoods.length > 0 && (
          <Button
            variant="subtle"
            size="compact-sm"
            mt="md"
            onClick={() => setShowRecentFoods((visible) => !visible)}
          >
            {showRecentFoods ? 'Hide recent foods' : 'Show recent foods'}
          </Button>
        )}
        {searching && (
          <Text size="sm" c="dimmed" mt="sm">
            Searching Open Food Facts...
          </Text>
        )}
        {error && (
          <Text size="sm" c="red" mt="sm">
            {error}
          </Text>
        )}
        {!searching &&
          query.trim().length >= 2 &&
          !error &&
          results.length === 0 && (
            <Text size="sm" c="dimmed" mt="sm">
              No foods found.
            </Text>
          )}
        {visibleFoods.length > 0 && (
          <Stack mt="sm">
            {visibleFoods.map((food, index) => (
              <Button
                key={`${food.productCode}-${index}`}
                variant="subtle"
                justify="flex-start"
                onClick={() => {
                  const entry = replacingEntryId
                    ? entries.find(
                        (candidate) => candidate.id === replacingEntryId,
                      )
                    : undefined;
                  if (entry) void replaceEntry(entry, food);
                  else addFood(food);
                }}
              >
                <Stack gap={0} align="flex-start">
                  <FoodResultLabel food={food} />
                  <FoodResultMetadata food={food} />
                </Stack>
              </Button>
            ))}
            {query.trim().length >= 2 && hasMoreResults && (
              <Button
                variant="default"
                loading={loadingMore}
                onClick={() => void loadMoreResults()}
              >
                Load more results
              </Button>
            )}
          </Stack>
        )}
        {!query && recentFoods.length === 0 && (
          <Text size="sm" c="dimmed" mt="sm">
            Your recent foods will appear here after you save diary entries.
          </Text>
        )}
        {saveMessage && (
          <Alert
            mt="md"
            color={saveMessage.startsWith('Saved') ? 'green' : 'red'}
          >
            {saveMessage}
          </Alert>
        )}
        {captureItems.length > 0 && (
          <Stack mt="xl">
            <Text fw={600}>Foods to review ({captureItems.length})</Text>
            {captureItems.map((item, index) => {
              const validation = validateCaptureItem(item);
              return (
                <Card key={item.id} withBorder padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <FoodResultLabel food={item.food} />
                      <FoodResultMetadata food={item.food} />
                      {item.food.brand && (
                        <Text size="sm" c="dimmed">
                          {item.food.brand}
                        </Text>
                      )}
                    </div>
                    <Group gap="xs">
                      <Button
                        size="compact-xs"
                        variant="default"
                        onClick={() => {
                          setEditingCaptureId(item.id);
                          setQuery('');
                        }}
                      >
                        Change food
                      </Button>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          setCaptureItems((items) =>
                            items.filter(
                              (candidate) => candidate.id !== item.id,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Group>
                  </Group>
                  {item.food.quantityDescription && (
                    <Text size="xs" c="dimmed" mt="xs">
                      Food data: {item.food.quantityDescription}
                    </Text>
                  )}
                  <Group mt="sm" align="flex-end" className="capture-controls">
                    <div>
                      <label htmlFor={`amount-${item.id}`}>
                        {item.unit === 'named'
                          ? (item.food.servingOption?.label ?? 'Amount')
                          : 'Grams'}
                      </label>
                      <input
                        id={`amount-${item.id}`}
                        aria-label={`${item.unit === 'named' ? (item.food.servingOption?.label ?? 'Amount') : 'Grams'} for ${item.food.name} ${index + 1}`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="1"
                        value={item.amount}
                        onChange={(event) =>
                          updateItem(item.id, {
                            amount: event.currentTarget.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor={`unit-${item.id}`}>Unit</label>
                      <select
                        id={`unit-${item.id}`}
                        aria-label={`Unit for ${item.food.name} ${index + 1}`}
                        value={item.unit}
                        onChange={(event) =>
                          updateItem(item.id, {
                            unit: event.currentTarget
                              .value as CaptureItem['unit'],
                          })
                        }
                      >
                        <option value="g">g</option>
                        {item.food.servingOption && (
                          <option value="named">
                            {item.food.servingOption.label} (
                            {item.food.servingOption.grams} g)
                          </option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`meal-${item.id}`}>Meal</label>
                      <select
                        id={`meal-${item.id}`}
                        aria-label={`Meal for ${item.food.name} ${index + 1}`}
                        value={item.mealSlot}
                        onChange={(event) =>
                          updateItem(item.id, {
                            mealSlot: event.currentTarget
                              .value as CaptureItem['mealSlot'],
                          })
                        }
                      >
                        {MEAL_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {mealSlotLabel(slot)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Group>
                  <AddedFoodNutrition item={item} />
                  {(reviewed || item.amount) && !validation.valid && (
                    <Text size="sm" c="red" mt="xs">
                      {validation.message}
                    </Text>
                  )}
                </Card>
              );
            })}
            <Card withBorder padding="sm">
              <Text fw={600}>Capture total</Text>
              <Text size="sm" mt="xs">
                {formatNutrition(dailyTotals.calories, ' kcal')} ·{' '}
                {formatNutrition(dailyTotals.protein, ' g protein')} ·{' '}
                {formatNutrition(dailyTotals.carbohydrates, ' g carbs')} ·{' '}
                {formatNutrition(dailyTotals.fat, ' g fat')}
              </Text>
            </Card>
            <Group justify="space-between">
              <Text size="sm" c={invalidItems.length ? 'red' : 'dimmed'}>
                {invalidItems.length
                  ? `${invalidItems.length} item(s) need attention.`
                  : 'All items are ready to review.'}
              </Text>
              <Group>
                <Button
                  variant="default"
                  disabled={!captureItems.length}
                  onClick={() => setReviewed(true)}
                >
                  Review capture
                </Button>
                <Button
                  loading={saving}
                  disabled={invalidItems.length > 0}
                  onClick={() => void saveCapture()}
                >
                  Add foods
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Card>
      {entryMessage && <Alert mb="md">{entryMessage}</Alert>}
      <Stack>
        {MEAL_SLOTS.map((slot) => {
          const mealEntries = entries.filter(
            (entry) => entry.meal_slot === slot,
          );
          const mealTotal = sumNutrition(
            mealEntries.map((entry) =>
              scaleNutrition(entry.nutrition_per_100g, entry.grams),
            ),
          );
          const mealCalories =
            mealTotal.calories === undefined
              ? '—'
              : `${Math.round(mealTotal.calories)} kcal`;
          const mealProtein =
            mealTotal.protein === undefined
              ? '—'
              : `${Math.round(mealTotal.protein)} g protein`;
          return (
            <Card
              key={slot}
              withBorder
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const entryId = event.dataTransfer.getData('text/diary-entry');
                const entry = entries.find(
                  (candidate) => candidate.id === entryId,
                );
                if (entry && entry.meal_slot !== slot)
                  void editEntry(entry, { meal_slot: slot });
              }}
            >
              <Group justify="space-between">
                <Text fw={600}>{mealSlotLabel(slot)}</Text>
                <Text size="sm" c="dimmed">
                  {mealEntries.length
                    ? `${mealCalories} · ${mealProtein}`
                    : 'No entries yet'}
                </Text>
              </Group>
              {mealEntries.map((entry) => {
                const entryCalories = scaleNutrition(
                  entry.nutrition_per_100g,
                  entry.grams,
                ).calories;
                const updating = replacingEntryId === entry.id;
                return (
                  <Card
                    key={entry.id}
                    className="diary-entry-row"
                    mt={2}
                    p={4}
                    withBorder={false}
                    draggable
                    onDragStart={(event) =>
                      event.dataTransfer.setData('text/diary-entry', entry.id)
                    }
                  >
                    <Group justify="space-between">
                      <Group gap="xs" wrap="nowrap">
                        <Text
                          component="span"
                          size="sm"
                          c="dimmed"
                          title="Drag to move between meals"
                          aria-label="Drag to move between meals"
                        >
                          ⠿
                        </Text>{' '}
                        <Text size="sm">
                          {displayFoodName(entry.product_name)}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {entryCalories === undefined
                            ? '—'
                            : `${Math.round(entryCalories)} kcal`}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Group gap={4} wrap="nowrap">
                          <input
                            aria-label={`Grams for ${entry.product_name}`}
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            defaultValue={entry.grams}
                            onBlur={(event) => {
                              const grams = Number(event.currentTarget.value);
                              if (grams > 0 && grams !== entry.grams)
                                void editEntry(entry, { grams });
                            }}
                          />
                          <Text size="sm" c="dimmed">
                            g
                          </Text>
                        </Group>
                        <select
                          aria-label={`Meal for ${entry.product_name}`}
                          value={entry.meal_slot}
                          onChange={(event) =>
                            void editEntry(entry, {
                              meal_slot: event.currentTarget
                                .value as DiaryEntry['meal_slot'],
                            })
                          }
                        >
                          {MEAL_SLOTS.map((option) => (
                            <option key={option} value={option}>
                              {mealSlotLabel(option)}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="compact-xs"
                          variant="default"
                          onClick={() => {
                            setReplacingEntryId(updating ? null : entry.id);
                            setQuery('');
                          }}
                        >
                          Update
                        </Button>
                        <Button
                          size="compact-xs"
                          color="red"
                          variant="subtle"
                          onClick={() => void removeEntry(entry)}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Group>
                  </Card>
                );
              })}
            </Card>
          );
        })}
      </Stack>
      <Container size="md" h="100%" py="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed" mt="xl">
            🙆🏼 Signed in as {session.user.email}
          </Text>
          <Text size="xs" c="dimmed" mt="xl">
            Made by Martin 🤍 |{' '}
            <a href="https://github.com/MartinDM/food-tracker">Repo</a>
          </Text>
        </Group>
      </Container>
    </Container>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <AppShell header={{ height: 64 }}>
      <AppShell.Header>
        <Container size="md" h="100%" py="md">
          <Group justify="space-between">
            <Text fw={800}>
              <span role="img" aria-label="Battery">
                🔋
              </span>{' '}
              food diary
            </Text>
            {session && (
              <Button
                size="compact-sm"
                variant="subtle"
                onClick={() => void supabase?.auth.signOut()}
              >
                Sign out
              </Button>
            )}
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        {session ? (
          <Diary session={session} />
        ) : (
          <Container>
            <SignIn onSignedIn={setSession} />
          </Container>
        )}
      </AppShell.Main>
    </AppShell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={{ primaryColor: 'orange', defaultRadius: 'md' }}>
      <App />
    </MantineProvider>
  </StrictMode>,
);
