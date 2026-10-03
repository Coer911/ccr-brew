import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getRecipe } from '@/lib/db/queries';
import { RecipeForm } from '@/components/admin/Forms';
import { deleteRecipe } from '@/app/admin/actions';
import { formatSteps } from '@/lib/steps-text';

export default async function AdminRecipePage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ product?: string }>;
}) {
  const { id } = await params;

  if (id === 'new') {
    const product = await getProductById(Number((await searchParams).product));
    if (!product) notFound();
    return (
      <>
        <Link href={`/admin/product/${product.id}`} className="text-sm text-muted">← {product.name}</Link>
        <h1 className="text-2xl font-bold">Новый рецепт</h1>
        <RecipeForm r={{ productId: product.id }} />
      </>
    );
  }

  const r = await getRecipe(Number(id));
  if (!r) notFound();
  const product = await getProductById(r.productId);

  return (
    <>
      <Link href={`/admin/product/${r.productId}`} className="text-sm text-muted">← {product?.name}</Link>
      <h1 className="text-2xl font-bold">Рецепт</h1>
      <RecipeForm r={{ ...r, stepsText: formatSteps(r.steps) }} />
      <div className="flex justify-between pt-4">
        <Link href={`/brew/${r.id}`} className="text-sm underline">Открыть как покупатель</Link>
        <form action={deleteRecipe.bind(null, r.id, r.productId)}>
          <button className="text-sm text-danger">Удалить рецепт</button>
        </form>
      </div>
    </>
  );
}
