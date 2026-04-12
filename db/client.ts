import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

const expo = openDatabaseSync("nutrilog.db", { enableChangeListener: true });

export const db = drizzle(expo);
