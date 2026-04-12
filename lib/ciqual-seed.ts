import { db } from "@/db/client";
import { foods } from "@/db/schema";
import { getMeta, setMeta } from "./app-meta";
import { createId } from "./nanoid";

interface CiqualEntry {
	code: number;
	name: string;
	group: string | null;
	kcal: number | null;
	protein: number | null;
	carbs: number | null;
	fat: number | null;
	fiber: number | null;
	sodiumMg: number | null;
}

const SEED_FLAG = "ciqual_seeded_v1";
const CHUNK_SIZE = 80;

export async function seedCiqualIfNeeded(): Promise<{
	seeded: boolean;
	count: number;
}> {
	const flag = await getMeta(SEED_FLAG);
	if (flag) return { seeded: false, count: 0 };

	const entries = (await import("@/assets/ciqual.json"))
		.default as CiqualEntry[];
	const now = new Date().toISOString();

	const rows = entries
		.filter(
			(e) =>
				e.kcal != null && e.protein != null && e.carbs != null && e.fat != null,
		)
		.map((e) => ({
			id: createId(),
			source: "ciqual" as const,
			barcode: null,
			name: e.name,
			brand: null,
			imageUrl: null,
			kcalPer100g: e.kcal as number,
			proteinPer100g: e.protein as number,
			carbsPer100g: e.carbs as number,
			fatPer100g: e.fat as number,
			fiberPer100g: e.fiber,
			defaultServingG: 100,
			useCount: 0,
			lastUsedAt: null,
			lastOffFetchAt: null,
			createdAt: now,
		}));

	for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
		const chunk = rows.slice(i, i + CHUNK_SIZE);
		await db.insert(foods).values(chunk);
	}

	await setMeta(SEED_FLAG, String(Date.now()));
	return { seeded: true, count: rows.length };
}
