import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { foodServings } from "@/db/schema";

export type FoodServingRow = typeof foodServings.$inferSelect;

const DEFAULT_LABEL_100G = "100 g";

export async function getServingsForFood(
	foodId: string,
): Promise<FoodServingRow[]> {
	return db.select().from(foodServings).where(eq(foodServings.foodId, foodId));
}

/**
 * Ensure a food has at least a 100 g default serving, plus an optional parsed
 * portion. Idempotent: won't duplicate if already present.
 */
export async function ensureServings(
	foodId: string,
	extra?: { label: string; grams: number } | null,
): Promise<void> {
	const existing = await getServingsForFood(foodId);
	const hasHundred = existing.some((s) => Math.abs(s.grams - 100) < 0.01);

	if (!hasHundred) {
		await db.insert(foodServings).values({
			foodId,
			label: DEFAULT_LABEL_100G,
			grams: 100,
			isDefault: !extra,
		});
	}

	if (extra && extra.grams > 0) {
		const duplicate = existing.some(
			(s) => Math.abs(s.grams - extra.grams) < 0.01 && s.label === extra.label,
		);
		if (!duplicate) {
			await db.insert(foodServings).values({
				foodId,
				label: extra.label,
				grams: extra.grams,
				isDefault: true,
			});
		}
	}
}
