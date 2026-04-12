import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appMeta } from "@/db/schema";

export async function getMeta(key: string): Promise<string | null> {
	const rows = await db
		.select()
		.from(appMeta)
		.where(eq(appMeta.key, key))
		.limit(1);
	return rows[0]?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
	await db
		.insert(appMeta)
		.values({ key, value })
		.onConflictDoUpdate({ target: appMeta.key, set: { value } });
}
