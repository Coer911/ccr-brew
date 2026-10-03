import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

// Один пул на процесс; в dev переживает hot reload. Создаётся лениво,
// чтобы `next build` не требовал DATABASE_URL.
const g = globalThis as unknown as { brewDb?: Db };

export function getDb(): Db {
  if (!g.brewDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL не задан');
    g.brewDb = drizzle({ client: postgres(url, { max: 5, prepare: false, onnotice: () => {} }), schema });
  }
  return g.brewDb;
}
