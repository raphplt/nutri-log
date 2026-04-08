import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

const expo = openDatabaseSync('nutrilog.db', { enableChangeListener: true });

export const db = drizzle(expo);
