import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Product = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_small_url?: string;
  serving_size?: string;
  quantity?: string;
  categories_tags?: string[];
  packaging_tags?: string[];
  countries_tags?: string[];
  countries_en?: string;
  nova_group?: number;
  additives_tags?: string[];
  categories?: string;
  nutriments?: Record<string, unknown>;
};

type FoodType = "fruit" | "meat" | "dairy" | "packaged" | "drink" | "sweets" | "food";
type MetadataQuality = "complete" | "partial";

function servingOption(value: string | undefined): { label: string; grams: number } | undefined {
  const match = value?.match(/(.+?)\s*\(?\s*(\d+(?:[.,]\d+)?)\s*g\s*\)?$/i);
  if (!match) return undefined;
  const grams = Number(match[2].replace(",", "."));
  return Number.isFinite(grams) && grams > 0
    ? { label: match[1].trim().replace(/\s*\($/, ""), grams }
    : undefined;
}

function hasAccentOverA(value: string): boolean {
  const decomposed = value.normalize("NFD").toLowerCase();
  for (let index = 0; index < decomposed.length - 1; index += 1) {
    if (decomposed[index] === "a" && /\p{M}/u.test(decomposed[index + 1])) {
      return true;
    }
  }
  return false;
}

function formatBrandName(value: string | undefined): string | undefined {
  return value?.replace(/\blidl\b/gi, "Lidl");
}

function formatProductName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const normalised = trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase()
    ? trimmed.toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
    : trimmed;
  return formatBrandName(normalised) ?? normalised;
}

function foodType(product: Product): FoodType {
  const tags = [...(product.categories_tags ?? []), ...(product.packaging_tags ?? [])].join(" ").toLowerCase();
  if (tags.includes("fruit")) return "fruit";
  if (tags.includes("meat") || tags.includes("fish") || tags.includes("seafood")) return "meat";
  if (tags.includes("dair") || tags.includes("milk") || tags.includes("cheese")) return "dairy";
  if (tags.includes("sweet") || tags.includes("candy") || tags.includes("chocolate")) return "sweets";
  if (tags.includes("beverage") || tags.includes("drink") || tags.includes("juice") || tags.includes("soda")) return "drink";
  if (tags.includes("can") || tags.includes("packag")) return "packaged";
  return "food";
}

function metadataQuality(product: Product): MetadataQuality {
  const nutrientCount = Object.values(product.nutriments ?? {}).filter(numberOrUndefined).length;
  const hasCompleteRecord = Boolean(
    product.code &&
    product.product_name &&
    product.brands &&
    product.image_front_small_url &&
    product.categories_tags?.length &&
    nutrientCount >= 4,
  );
  return hasCompleteRecord ? "complete" : "partial";
}

function isUkMarket(product: Product): boolean {
  const tags = (product.countries_tags ?? []).join(" ").toLowerCase();
  const names = (product.countries_en ?? "").toLowerCase();
  return tags.includes("united-kingdom") || tags.includes("uk") || names.includes("united kingdom");
}

function wholeFoodPreference(product: Product): "preferred" | "neutral" {
  const tags = (product.categories_tags ?? []).join(" ").toLowerCase();
  const name = (product.product_name ?? "").toLowerCase();
  const simpleCategories = ["fruits", "vegetables", "legumes", "nuts", "seeds", "eggs", "meat", "fish", "seafood"];
  const processedCategories = ["snack", "confection", "candy", "sweets", "dessert", "prepared", "instant", "sauce"];
  const simpleCategory = simpleCategories.some((category) => tags.includes(category));
  const processedCategory = processedCategories.some((category) => tags.includes(category));
  const simpleName = /^(apple|banana|orange|tomato|potato|carrot|onion|egg|chicken|beef|fish|salmon|sardine)s?$/.test(name.trim());
  const lowProcessing = product.nova_group === 1 || product.nova_group === 2;
  return simpleName || (simpleCategory && !processedCategory && lowProcessing) ? "preferred" : "neutral";
}

function searchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseSearchQuery(value: string): { include: string; exclude: string[] } {
  const terms = value.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const exclude: string[] = [];
  const include: string[] = [];
  for (const term of terms) {
    const normalized = term.replace(/^"|"$/g, "").trim();
    if (normalized.startsWith("-") && normalized.length > 1) exclude.push(searchText(normalized.slice(1)));
    else if (normalized) include.push(normalized);
  }
  return { include: include.join(" "), exclude };
}

function matchesExcludedTitle(product: Product, excludedTerms: string[]): boolean {
  const title = searchText(product.product_name ?? "");
  return excludedTerms.some((term) => term.length > 0 && title.includes(term));
}

function containsQueryWord(value: string, query: string): boolean {
  const text = searchText(value);
  const needle = searchText(query);
  return needle.length > 0 && new RegExp(`(?:^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: |$)`).test(text);
}

function isDirectFoodName(value: string, query: string): boolean {
  return searchText(value) === searchText(query);
}

function processedFoodSignal(product: Product): boolean {
  const name = searchText(product.product_name ?? "");
  const categories = searchText((product.categories_tags ?? []).join(" "));
  return [
    "juice", "drink", "beverage", "sauce", "soup", "cereal", "biscuit", "cookie",
    "cake", "pie", "bar", "snack", "crisps", "chips", "chocolate", "candy",
    "dessert", "prepared", "flavoured", "flavored", "instant", "ready meal",
  ].some((term) => name.includes(term) || categories.includes(term));
}

function relevanceScore(product: Product, query: string, ukMarket: boolean, wholeFood: boolean): number {
  const needle = searchText(query);
  const name = searchText(product.product_name ?? "");
  const categories = searchText((product.categories_tags ?? []).join(" "));
  const exactName = name === needle;
  const directFoodName = isDirectFoodName(product.product_name ?? "", query);
  const startsWithQuery = name.startsWith(`${needle} `);
  const queryWord = containsQueryWord(product.product_name ?? "", query);
  const processed = processedFoodSignal(product);
  let score = ukMarket ? 20 : 0;
  if (wholeFood) score += 120;
  if (directFoodName) score += 260;
  else if (exactName) score += 220;
  else if (startsWithQuery) score += 90;
  else if (queryWord) score += 45;
  else if (name.includes(needle)) score += 5;
  if (categories.includes(needle)) score += 15;
  if (processed) score -= 90;
  if (!directFoodName && queryWord) score -= 65;
  return score;
}

const numberOrUndefined = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const macroNutrientKeys = new Set(["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"]);

function hasMicronutrients(product: Product): boolean {
  return Object.entries(product.nutriments ?? {}).some(([key, value]) =>
    key.endsWith("_100g") && !macroNutrientKeys.has(key) && numberOrUndefined(value) !== undefined
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });

  const body = await request.json().catch(() => ({}));
  const rawQuery = typeof body.query === "string" ? body.query.trim() : "";
  const parsedQuery = parseSearchQuery(rawQuery);
  const query = parsedQuery.include;
  if (query.length < 2) return Response.json({ results: [], page: 1, hasMore: false }, { headers: corsHeaders });
  const requestedPage = typeof body.page === "number" && Number.isInteger(body.page) && body.page > 0 ? body.page : 1;
  const pageSize = typeof body.pageSize === "number" && Number.isInteger(body.pageSize) ? Math.min(Math.max(body.pageSize, 1), 20) : 20;

  const baseUrl = Deno.env.get("OPENFOODFACTS_API_BASE_URL") ?? "https://world.openfoodfacts.org";
  const userAgent = Deno.env.get("OPENFOODFACTS_USER_AGENT") ?? "FoodDiary/0.1 (contact: configure-me@example.com)";
  const url = new URL("/cgi/search.pl", baseUrl);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page", String(requestedPage));
  url.searchParams.set("page_size", String(pageSize));
  let providerResponse = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (providerResponse.status === 503) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    providerResponse = await fetch(url, { headers: { "User-Agent": userAgent } });
  }
  if (!providerResponse.ok) return Response.json({ error: "Food search is temporarily unavailable" }, { status: 502, headers: corsHeaders });

  const providerBody = await providerResponse.json().catch(() => null) as { products?: Product[]; page_count?: number; count?: number } | null;
  if (!providerBody) return Response.json({ error: "Food search returned an invalid response" }, { status: 502, headers: corsHeaders });
  const results = (providerBody.products ?? [])
    .filter((product) => product.code && product.product_name && !hasAccentOverA(product.product_name) && hasMicronutrients(product) && isUkMarket(product) && !matchesExcludedTitle(product, parsedQuery.exclude))
    .map((product) => {
      const ukMarket = isUkMarket(product);
      const wholeFood = wholeFoodPreference(product) === "preferred";
      return {
      productCode: product.code!,
      name: formatProductName(product.product_name!),
      brand: formatBrandName(product.brands),
      imageUrl: product.image_front_small_url || undefined,
      servingOption: servingOption(product.serving_size),
      quantityDescription: product.quantity || product.serving_size || undefined,
      foodType: foodType(product),
      metadataQuality: metadataQuality(product),
      ukMarket,
      wholeFood,
      relevance: relevanceScore(product, query, ukMarket, wholeFood),
      rawNutrition: product.nutriments ?? {},
      nutritionPer100g: {
        calories: numberOrUndefined(product.nutriments?.["energy-kcal_100g"]),
        protein: numberOrUndefined(product.nutriments?.proteins_100g),
        carbohydrates: numberOrUndefined(product.nutriments?.carbohydrates_100g),
        fat: numberOrUndefined(product.nutriments?.fat_100g),
      },
      };
    })
    .sort((a, b) => Number(b.ukMarket) - Number(a.ukMarket) || b.relevance - a.relevance)
    .map(({ relevance: _relevance, ...result }) => result);

  return Response.json({
    results,
    page: requestedPage,
    hasMore: requestedPage < (providerBody.page_count ?? requestedPage),
    total: providerBody.count ?? results.length,
  }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
