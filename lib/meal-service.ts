import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { meals, mealItems } from '@/db/schema';
import { createId } from './nanoid';
import { incrementUseCount } from './food-service';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Get or create a meal for a given date and type. Returns the meal ID. */
export async function getOrCreateMeal(date: string, mealType: MealType): Promise<string> {
  const [existing] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.date, date), eq(meals.mealType, mealType)))
    .limit(1);

  if (existing) return existing.id;

  const id = createId();
  await db.insert(meals).values({
    id,
    date,
    mealType,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export interface AddMealItemInput {
  date: string;
  mealType: MealType;
  foodId: string | null;
  name: string;
  quantityG: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
}

/** Add an item to a meal. Creates the meal if needed. */
export async function addMealItem(input: AddMealItemInput) {
  const mealId = await getOrCreateMeal(input.date, input.mealType);

  await db.insert(mealItems).values({
    id: createId(),
    mealId,
    foodId: input.foodId,
    name: input.name,
    quantityG: input.quantityG,
    kcal: input.kcal,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    fiber: input.fiber ?? null,
    createdAt: new Date().toISOString(),
  });

  // Increment food usage
  if (input.foodId) {
    await incrementUseCount(input.foodId);
  }
}

/** Guess current meal type based on time of day. */
export function guessMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'snack';
  return 'dinner';
}
