import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getRecipe } from '@/lib/db/queries';
import { getSession } from '@/lib/auth/session';
import { BrewSession } from '@/components/BrewSession';

export const dynamic = 'force-dynamic';

export default async function BrewPage({ params }: { params: Promise<{ recipeId: string }> }) {
  const id = Number((await params).recipeId);
  if (!Number.isSafeInteger(id)) notFound();
  const recipe = await getRecipe(id);
  if (!recipe || !recipe.isPublished) notFound();
  const product = await getProductById(recipe.productId);
  if (!product) notFound();
  const session = await getSession();

  return (
    <div className="space-y-4">
      <Link href={`/coffee/${product.slug}`} className="text-sm text-muted">← {product.name}</Link>
      <BrewSession
        recipe={recipe}
        productName={product.name}
        loggedIn={!!session}
        botUsername={process.env.BOT_USERNAME || 'Brewing_ccrbot'}
      />
    </div>
  );
}
