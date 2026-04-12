import { fetchJson, HttpError } from "./http";

const PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";
const SEARCH_URL = "https://search.openfoodfacts.org/search";

const PRODUCT_FIELDS =
	"code,product_name,brands,nutriments,image_front_small_url,serving_quantity,serving_size,nutriscore_grade,nova_group";
const SEARCH_FIELDS =
	"code,product_name,brands,image_small_url,nutriments,serving_size,serving_quantity,nutriscore_grade,nova_group";

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
	servingSize: string | null;
	nutriscoreGrade: string | null;
	novaGroup: number | null;
}

export interface ParsedServing {
	label: string;
	grams: number;
}

/**
 * Extract a serving from OFF fields. Prefers `serving_quantity` (numeric grams)
 * and falls back to regex-parsing `serving_size` strings like "30 g (1 biscuit)".
 */
export function parseServing(
	servingQuantity: number | null,
	servingSize: string | null,
): ParsedServing | null {
	if (servingQuantity != null && servingQuantity > 0) {
		const label = servingSize?.trim() || `${servingQuantity} g`;
		return { label, grams: servingQuantity };
	}
	if (!servingSize) return null;
	const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
	if (!match) return null;
	const grams = Number(match[1].replace(",", "."));
	if (!Number.isFinite(grams) || grams <= 0) return null;
	return { label: servingSize.trim(), grams };
}

interface ProductResponse {
	status: number;
	product?: Record<string, unknown>;
}

interface SearchResponse {
	hits: Record<string, unknown>[];
	count?: number;
	page?: number;
	page_count?: number;
	page_size?: number;
}

function toNum(v: unknown): number | null {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string") {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function parseProduct(raw: Record<string, unknown>): OFFProduct | null {
	const nutriments = raw.nutriments as Record<string, unknown> | undefined;
	if (!nutriments) return null;

	const kcal = toNum(nutriments["energy-kcal_100g"]);
	if (kcal == null) return null;

	const imageCandidate = raw.image_front_small_url ?? raw.image_small_url;
	const novaRaw = raw.nova_group;

	return {
		code: String(raw.code ?? ""),
		name: String(raw.product_name ?? "").trim() || "Unknown product",
		brand: raw.brands ? String(raw.brands) : null,
		imageUrl: imageCandidate ? String(imageCandidate) : null,
		kcalPer100g: kcal,
		proteinPer100g: toNum(nutriments.proteins_100g) ?? 0,
		carbsPer100g: toNum(nutriments.carbohydrates_100g) ?? 0,
		fatPer100g: toNum(nutriments.fat_100g) ?? 0,
		fiberPer100g: toNum(nutriments.fiber_100g),
		servingG: toNum(raw.serving_quantity),
		servingSize: raw.serving_size ? String(raw.serving_size) : null,
		nutriscoreGrade: raw.nutriscore_grade ? String(raw.nutriscore_grade) : null,
		novaGroup: toNum(novaRaw),
	};
}

export async function fetchProductByBarcode(
	barcode: string,
	signal?: AbortSignal,
): Promise<OFFProduct | null> {
	const url = `${PRODUCT_URL}/${encodeURIComponent(barcode)}?fields=${PRODUCT_FIELDS}`;
	try {
		const json = await fetchJson<ProductResponse>(url, { signal });
		if (json.status !== 1 || !json.product) return null;
		return parseProduct(json.product);
	} catch (err) {
		if (err instanceof HttpError && err.status === 404) return null;
		throw err;
	}
}

export async function searchProducts(
	query: string,
	{
		langs = ["fr", "en"],
		pageSize = 20,
		page = 1,
		signal,
	}: {
		langs?: string[];
		pageSize?: number;
		page?: number;
		signal?: AbortSignal;
	} = {},
): Promise<OFFProduct[]> {
	const params = new URLSearchParams({
		q: query,
		langs: langs.join(","),
		page: String(page),
		page_size: String(pageSize),
		fields: SEARCH_FIELDS,
	});
	const url = `${SEARCH_URL}?${params.toString()}`;

	const json = await fetchJson<SearchResponse>(url, { signal });
	const products: OFFProduct[] = [];
	for (const raw of json.hits ?? []) {
		const p = parseProduct(raw);
		if (p) products.push(p);
	}
	return products;
}
