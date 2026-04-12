import { asc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { mealItems, meals } from "@/db/schema";

export interface MealWithItems {
	id: string;
	mealType: string;
	items: {
		id: string;
		name: string;
		quantityG: number;
		kcal: number;
		protein: number;
		carbs: number;
		fat: number;
	}[];
	totalKcal: number;
}

export function useDailyMeals(date: string): MealWithItems[] {
	const { data: mealsData } = useLiveQuery(
		db
			.select()
			.from(meals)
			.where(eq(meals.date, date))
			.orderBy(asc(meals.createdAt)),
	);

	const { data: itemsData } = useLiveQuery(db.select().from(mealItems));

	// Group items by meal
	const mealMap = new Map<string, MealWithItems>();

	for (const meal of mealsData) {
		mealMap.set(meal.id, {
			id: meal.id,
			mealType: meal.mealType,
			items: [],
			totalKcal: 0,
		});
	}

	for (const item of itemsData) {
		const meal = mealMap.get(item.mealId);
		if (meal) {
			meal.items.push({
				id: item.id,
				name: item.name,
				quantityG: item.quantityG,
				kcal: item.kcal,
				protein: item.protein,
				carbs: item.carbs,
				fat: item.fat,
			});
			meal.totalKcal += item.kcal;
		}
	}

	return Array.from(mealMap.values());
}
