import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { weightLog } from '@/db/schema';
import { createId } from './nanoid';

/** Upsert a weight entry for a given date (one entry per day). */
export async function upsertWeight(date: string, weightKg: number) {
  const now = new Date().toISOString();

  // Check if entry exists for this date
  const [existing] = await db
    .select()
    .from(weightLog)
    .where(eq(weightLog.date, date))
    .limit(1);

  if (existing) {
    await db
      .update(weightLog)
      .set({ weightKg, createdAt: now })
      .where(eq(weightLog.id, existing.id));
  } else {
    await db.insert(weightLog).values({
      id: createId(),
      date,
      weightKg,
      createdAt: now,
    });
  }
}
