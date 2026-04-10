import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { weightLog } from '@/db/schema';

export function useRecentWeights(limit = 30) {
  const { data } = useLiveQuery(
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(limit),
  );

  // Return in chronological order for chart
  return [...data].reverse();
}
