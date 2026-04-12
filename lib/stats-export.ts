import { and, between, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { mealItems, meals, weightLog } from "@/db/schema";

function escapeCsv(value: unknown): string {
	if (value === null || value === undefined) return "";
	const str = String(value);
	if (/[,"\n]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
	const head = headers.join(",");
	const body = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
	return `${head}\n${body}`;
}

export async function buildPeriodCsv(
	from: string,
	to: string,
): Promise<string> {
	const items = await db
		.select({
			date: meals.date,
			mealType: meals.mealType,
			name: mealItems.name,
			quantityG: mealItems.quantityG,
			kcal: mealItems.kcal,
			protein: mealItems.protein,
			carbs: mealItems.carbs,
			fat: mealItems.fat,
		})
		.from(mealItems)
		.innerJoin(meals, sql`${mealItems.mealId} = ${meals.id}`)
		.where(and(gte(meals.date, from), lte(meals.date, to)))
		.orderBy(meals.date);

	const weights = await db
		.select({ date: weightLog.date, weightKg: weightLog.weightKg })
		.from(weightLog)
		.where(between(weightLog.date, from, to))
		.orderBy(weightLog.date);

	const mealsCsv = toCsv(
		[
			"date",
			"meal_type",
			"name",
			"quantity_g",
			"kcal",
			"protein",
			"carbs",
			"fat",
		],
		items.map((i) => [
			i.date,
			i.mealType,
			i.name,
			i.quantityG,
			i.kcal,
			i.protein,
			i.carbs,
			i.fat,
		]),
	);

	const weightsCsv = toCsv(
		["date", "weight_kg"],
		weights.map((w) => [w.date, w.weightKg]),
	);

	return `# NutriLog export ${from} -> ${to}\n\n## Meals\n${mealsCsv}\n\n## Weight\n${weightsCsv}\n`;
}
