import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { userGoals } from '@/db/schema';

export function useGoals() {
  const { data } = useLiveQuery(db.select().from(userGoals));
  const goals = data[0] ?? null;

  return {
    kcalTarget: goals?.kcalTarget ?? 2000,
    proteinTargetG: goals?.proteinTargetG ?? 150,
    carbsTargetG: goals?.carbsTargetG ?? 200,
    fatTargetG: goals?.fatTargetG ?? 65,
  };
}
