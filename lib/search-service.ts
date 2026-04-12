import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { FoodRow } from "./food-service";

export interface LocalSearchResult extends FoodRow {
	score: number;
}

const SEARCH_HISTORY_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

function tokenize(query: string): string[] {
	return query
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.split(/\s+/)
		.map((t) => t.replace(/[^a-z0-9]/g, ""))
		.filter((t) => t.length > 0);
}

function buildMatchExpression(tokens: string[]): string {
	return tokens.map((t) => `${t}*`).join(" ");
}

function recencyBoost(lastUsedAt: string | null): number {
	if (!lastUsedAt) return 1;
	const days = (Date.now() - new Date(lastUsedAt).getTime()) / 86400000;
	if (days < 1) return 0.5;
	if (days < 7) return 0.7;
	if (days < 30) return 0.9;
	return 1;
}

interface RawRow {
	id: string;
	source: string;
	barcode: string | null;
	name: string;
	brand: string | null;
	image_url: string | null;
	kcal_per_100g: number;
	protein_per_100g: number;
	carbs_per_100g: number;
	fat_per_100g: number;
	fiber_per_100g: number | null;
	default_serving_g: number | null;
	nutriscore_grade: string | null;
	nova_group: number | null;
	use_count: number | null;
	last_used_at: string | null;
	last_off_fetch_at: string | null;
	created_at: string;
	bm25: number;
}

function rawToFood(r: RawRow, score: number): LocalSearchResult {
	return {
		id: r.id,
		source: r.source,
		barcode: r.barcode,
		name: r.name,
		brand: r.brand,
		imageUrl: r.image_url,
		kcalPer100g: r.kcal_per_100g,
		proteinPer100g: r.protein_per_100g,
		carbsPer100g: r.carbs_per_100g,
		fatPer100g: r.fat_per_100g,
		fiberPer100g: r.fiber_per_100g,
		defaultServingG: r.default_serving_g,
		nutriscoreGrade: r.nutriscore_grade,
		novaGroup: r.nova_group,
		useCount: r.use_count,
		lastUsedAt: r.last_used_at,
		lastOffFetchAt: r.last_off_fetch_at,
		createdAt: r.created_at,
		score,
	};
}

export async function searchLocal(
	query: string,
	opts: { signal?: AbortSignal; limit?: number } = {},
): Promise<LocalSearchResult[]> {
	const tokens = tokenize(query);
	if (tokens.length === 0) return [];
	if (opts.signal?.aborted) return [];

	const match = buildMatchExpression(tokens);

	const rows = (await db.all(sql`
		SELECT f.*, bm25(foods_fts, 10.0, 3.0) AS bm25
		FROM foods_fts
		JOIN foods f ON f.rowid = foods_fts.rowid
		WHERE foods_fts MATCH ${match}
		LIMIT 40
	`)) as RawRow[];

	if (opts.signal?.aborted) return [];

	const scored = rows.map((r) => {
		const useBoost = 1 + Math.log(1 + (r.use_count ?? 0));
		const score = r.bm25 / useBoost / recencyBoost(r.last_used_at);
		return rawToFood(r, score);
	});

	scored.sort((a, b) => a.score - b.score);
	return scored.slice(0, opts.limit ?? 20);
}

export async function recordSearchHistory(query: string): Promise<void> {
	const normalized = query.trim();
	if (normalized.length < 3) return;

	const since = Date.now() - SEARCH_HISTORY_DEDUP_WINDOW_MS;
	const existing = (await db.all(sql`
		SELECT id FROM search_history
		WHERE lower(query) = lower(${normalized}) AND created_at >= ${since}
		LIMIT 1
	`)) as { id: number }[];

	if (existing.length > 0) return;

	await db.run(sql`
		INSERT INTO search_history (query, created_at)
		VALUES (${normalized}, ${Date.now()})
	`);
}

export async function getRecentSearches(limit = 5): Promise<string[]> {
	const rows = (await db.all(sql`
		SELECT query FROM search_history
		ORDER BY created_at DESC
		LIMIT ${limit}
	`)) as { query: string }[];
	return rows.map((r) => r.query);
}
