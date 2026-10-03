import { and, asc, desc, eq } from 'drizzle-orm';
import { getDb } from './client';
import { brews, products, recipes, recipeSteps, users } from './schema';
import type { Step } from '@/lib/timer/stages';
import type { TelegramUser } from '@/lib/auth/telegram';

export type Product = typeof products.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeWithSteps = Recipe & { steps: Step[] };

export async function listProducts(opts: { all?: boolean } = {}) {
  const db = getDb();
  return db.select().from(products)
    .where(opts.all ? undefined : eq(products.isPublished, true))
    .orderBy(asc(products.sortOrder), asc(products.id));
}

export async function getProductBySlug(slug: string) {
  const [p] = await getDb().select().from(products).where(eq(products.slug, slug)).limit(1);
  return p ?? null;
}

export async function getProductById(id: number) {
  const [p] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  return p ?? null;
}

export async function listRecipes(productId: number, opts: { all?: boolean } = {}) {
  return getDb().select().from(recipes)
    .where(opts.all
      ? eq(recipes.productId, productId)
      : and(eq(recipes.productId, productId), eq(recipes.isPublished, true)))
    .orderBy(asc(recipes.sortOrder), asc(recipes.id));
}

export async function getRecipe(id: number): Promise<RecipeWithSteps | null> {
  const db = getDb();
  const [r] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!r) return null;
  const rows = await db.select().from(recipeSteps)
    .where(eq(recipeSteps.recipeId, id)).orderBy(asc(recipeSteps.position));
  return {
    ...r,
    steps: rows.map((s) => ({
      kind: s.kind as Step['kind'], label: s.label, hint: s.hint,
      durationS: s.durationS, targetWaterG: s.targetWaterG,
    })),
  };
}

export async function upsertUser(u: TelegramUser) {
  const v = {
    telegramId: u.id, firstName: u.first_name ?? '', lastName: u.last_name ?? null,
    username: u.username ?? null, photoUrl: u.photo_url ?? null,
  };
  const [row] = await getDb().insert(users).values(v)
    .onConflictDoUpdate({ target: users.telegramId, set: { ...v, lastSeenAt: new Date() } })
    .returning();
  return row;
}

export async function getUser(id: number) {
  const [u] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}

export async function listBrews(userId: number) {
  return getDb().select({
    id: brews.id, createdAt: brews.createdAt, rating: brews.rating, taste: brews.taste,
    note: brews.note, actualTimeS: brews.actualTimeS, params: brews.params,
    productName: products.name, productSlug: products.slug,
  }).from(brews)
    .leftJoin(products, eq(products.id, brews.productId))
    .where(eq(brews.userId, userId))
    .orderBy(desc(brews.createdAt))
    .limit(200);
}
