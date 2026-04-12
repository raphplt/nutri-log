import { eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { mealItems, meals } from "@/db/schema";

export function useDailyTotals(date: string) {
	const { data: totalsData } = useLiveQuery(
		db
			.select({
				totalKcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
				totalProtein: sql<number>`coalesce(sum(${mealItems.protein}), 0)`,
				totalCarbs: sql<number>`coalesce(sum(${mealItems.carbs}), 0)`,
				totalFat: sql<number>`coalesce(sum(${mealItems.fat}), 0)`,
			})
			.from(mealItems)
			.innerJoin(meals, eq(mealItems.mealId, meals.id))
			.where(eq(meals.date, date)),
	);

	const row = totalsData[0];

	return {
		totalKcal: Math.round(row?.totalKcal ?? 0),
		totalProtein: Math.round(row?.totalProtein ?? 0),
		totalCarbs: Math.round(row?.totalCarbs ?? 0),
		totalFat: Math.round(row?.totalFat ?? 0),
	};
}
