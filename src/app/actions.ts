'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { brews } from '@/lib/db/schema';
import { getRecipe } from '@/lib/db/queries';
import { TASTES } from '@/lib/format';

export type SaveBrewResult = { ok: true } | { ok: false; error: 'auth' | 'invalid' };

export async function saveBrew(input: {
  recipeId: number; actualTimeS: number | null; rating: number | null; taste: string[]; note: string;
}): Promise<SaveBrewResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'auth' };

  const recipe = await getRecipe(Number(input.recipeId));
  if (!recipe) return { ok: false, error: 'invalid' };

  const rating = input.rating == null ? null : Math.round(Number(input.rating));
  if (rating != null && (rating < 1 || rating > 5)) return { ok: false, error: 'invalid' };
  const t = input.actualTimeS == null ? null : Math.round(Number(input.actualTimeS));
  const actualTimeS = t != null && Number.isFinite(t) && t >= 0 && t < 3600 ? t : null;

  await getDb().insert(brews).values({
    userId: session.userId,
    productId: recipe.productId,
    recipeId: recipe.id,
    params: {
      method: recipe.method, title: recipe.title, doseG: recipe.doseG, waterG: recipe.waterG,
      tempC: recipe.tempC, grind: recipe.grind,
    },
    actualTimeS,
    rating,
    taste: (Array.isArray(input.taste) ? input.taste : []).filter((x) => TASTES.includes(x)).slice(0, 12),
    note: String(input.note ?? '').slice(0, 2000),
  });
  revalidatePath('/journal');
  return { ok: true };
}
