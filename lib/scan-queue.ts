import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { scanQueue } from "@/db/schema";
import { getOrFetchByBarcode } from "./food-service";

const RATE_LIMIT_MS = 700;

export async function enqueueScan(barcode: string): Promise<void> {
	const existing = await db
		.select({ id: scanQueue.id })
		.from(scanQueue)
		.where(and(eq(scanQueue.barcode, barcode), isNull(scanQueue.resolvedAt)))
		.limit(1);
	if (existing.length > 0) return;
	await db.insert(scanQueue).values({
		barcode,
		createdAt: Date.now(),
		resolvedAt: null,
	});
}

export async function countPendingScans(): Promise<number> {
	const rows = await db
		.select({ id: scanQueue.id })
		.from(scanQueue)
		.where(isNull(scanQueue.resolvedAt));
	return rows.length;
}

/** Drain the queue, respecting the OFF rate limit (~100 req/min). */
export async function drainScanQueue(): Promise<number> {
	const pending = await db
		.select()
		.from(scanQueue)
		.where(isNull(scanQueue.resolvedAt));

	let resolved = 0;
	for (const item of pending) {
		try {
			await getOrFetchByBarcode(item.barcode);
			await db
				.update(scanQueue)
				.set({ resolvedAt: Date.now() })
				.where(eq(scanQueue.id, item.id));
			resolved++;
		} catch {
			break; // abort on network failure; retry later
		}
		await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
	}
	return resolved;
}
