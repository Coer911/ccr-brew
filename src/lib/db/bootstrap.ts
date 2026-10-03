import path from 'node:path';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './client';
import { products, recipes, recipeSteps } from './schema';
import { seedCatalog } from '@/seed/catalog';

/** Миграции + демо-каталог при пустой базе. Вызывается при старте сервера. */
export async function bootstrapDb(): Promise<void> {
  const db = getDb();
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
    migrationsTable: 'brew_migrations',
    migrationsSchema: 'public',
  });

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  if (n > 0) return;

  await db.transaction(async (tx) => {
    for (const [pi, p] of seedCatalog.entries()) {
      const { recipes: rs, ...fields } = p;
      const [prod] = await tx.insert(products).values({ ...fields, sortOrder: pi }).returning();
      for (const [ri, r] of rs.entries()) {
        const { steps, ...rf } = r;
        const [rec] = await tx.insert(recipes)
          .values({ ...rf, note: rf.note ?? '', productId: prod.id, sortOrder: ri }).returning();
        await tx.insert(recipeSteps).values(steps.map((s, i) => ({
          recipeId: rec.id, position: i, kind: s.kind, durationS: s.durationS,
          targetWaterG: s.targetWaterG ?? null, label: s.label, hint: s.hint ?? '',
        })));
      }
    }
  });
  console.log(`[brew] демо-каталог залит: ${seedCatalog.length} шт.`);
}
