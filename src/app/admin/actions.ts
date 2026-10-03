'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { products, recipes, recipeSteps } from '@/lib/db/schema';
import { parseSteps } from '@/lib/steps-text';

// Каждое действие заново проверяет админа на сервере.
async function requireAdmin() {
  if (!isAdmin(await getSession())) throw new Error('forbidden');
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const int = (f: FormData, k: string) => {
  const n = Number(f.get(k));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

export type FormState = { error?: string; saved?: boolean } | undefined;

export async function saveProduct(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(f, 'id');
  const slug = str(f, 'slug').toLowerCase();
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) return { error: 'Адрес (slug): латиница, цифры и дефис, 2–64 символа' };
  const name = str(f, 'name');
  if (!name) return { error: 'Нужно название' };

  const v = {
    slug, name,
    description: str(f, 'description'),
    origin: str(f, 'origin'), process: str(f, 'process'),
    variety: str(f, 'variety'), roastLevel: str(f, 'roastLevel'),
    flavorNotes: str(f, 'flavorNotes').split(',').map((x) => x.trim()).filter(Boolean),
    imageUrl: str(f, 'imageUrl') || null,
    sortOrder: int(f, 'sortOrder'),
    isPublished: f.get('isPublished') === 'on',
    updatedAt: new Date(),
  };
  const db = getDb();
  try {
    if (id) {
      await db.update(products).set(v).where(eq(products.id, id));
    } else {
      const [row] = await db.insert(products).values(v).returning({ id: products.id });
      revalidatePath('/', 'layout');
      redirect(`/admin/product/${row.id}`);
    }
  } catch (e) {
    if ((e as { code?: string })?.code === '23505') return { error: 'Такой адрес (slug) уже занят' };
    throw e;
  }
  revalidatePath('/', 'layout');
  return { saved: true };
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  await getDb().delete(products).where(eq(products.id, id));
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function saveRecipe(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(f, 'id');
  const productId = int(f, 'productId');
  const parsed = parseSteps(String(f.get('steps') ?? ''));
  if (!parsed.ok) return { error: parsed.error };
  const doseG = int(f, 'doseG');
  const waterG = int(f, 'waterG');
  if (doseG <= 0 || waterG <= 0) return { error: 'Доза и вода — больше нуля' };

  const v = {
    productId, method: str(f, 'method') || 'v60', title: str(f, 'title'),
    doseG, waterG, tempC: int(f, 'tempC'), grind: str(f, 'grind'), note: str(f, 'note'),
    sortOrder: int(f, 'sortOrder'), isPublished: f.get('isPublished') === 'on',
  };
  let recipeId = id;
  await getDb().transaction(async (tx) => {
    if (id) {
      await tx.update(recipes).set(v).where(eq(recipes.id, id));
      await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
    } else {
      [{ id: recipeId }] = await tx.insert(recipes).values(v).returning({ id: recipes.id });
    }
    await tx.insert(recipeSteps).values(parsed.steps.map((s, i) => ({
      recipeId, position: i, kind: s.kind, durationS: s.durationS,
      targetWaterG: s.targetWaterG, label: s.label, hint: s.hint,
    })));
  });
  revalidatePath('/', 'layout');
  if (!id) redirect(`/admin/recipe/${recipeId}`);
  return { saved: true };
}

export async function deleteRecipe(id: number, productId: number) {
  await requireAdmin();
  await getDb().delete(recipes).where(eq(recipes.id, id));
  revalidatePath('/', 'layout');
  redirect(`/admin/product/${productId}`);
}
