const BASE_URL = 'https://world.openfoodfacts.org';
const USER_AGENT = 'NutriLog/1.0 (contact@nutrilog.app)';
const FIELDS = 'code,product_name,brands,nutriments,image_front_small_url,serving_quantity';

export interface OFFProduct {
  code: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  servingG: number | null;
}

function parseProduct(raw: Record<string, unknown>): OFFProduct | null {
  const n = raw.nutriments as Record<string, number | undefined> | undefined;
  if (!n) return null;

  const kcal = n['energy-kcal_100g'];
  if (kcal == null) return null;

  return {
    code: String(raw.code ?? ''),
    name: String(raw.product_name ?? 'Produit inconnu'),
    brand: raw.brands ? String(raw.brands) : null,
    imageUrl: raw.image_front_small_url ? String(raw.image_front_small_url) : null,
    kcalPer100g: kcal,
    proteinPer100g: n['proteins_100g'] ?? 0,
    carbsPer100g: n['carbohydrates_100g'] ?? 0,
    fatPer100g: n['fat_100g'] ?? 0,
    fiberPer100g: n['fiber_100g'] ?? null,
    servingG: typeof raw.serving_quantity === 'number' ? raw.serving_quantity : null,
  };
}

export async function fetchProductByBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<OFFProduct | null> {
  const url = `${BASE_URL}/api/v2/product/${barcode}?fields=${FIELDS}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal,
  });
  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;
  return parseProduct(json.product);
}

export async function searchProducts(
  query: string,
  page = 1,
  signal?: AbortSignal,
): Promise<OFFProduct[]> {
  const url = new URL(`${BASE_URL}/cgi/search.pl`);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', 'true');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('page', String(page));
  url.searchParams.set('fields', FIELDS);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
    signal,
  });
  const json = await res.json();
  const products: OFFProduct[] = [];

  for (const raw of json.products ?? []) {
    const p = parseProduct(raw);
    if (p) products.push(p);
  }

  return products;
}
