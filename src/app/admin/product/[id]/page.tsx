import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, listRecipes } from '@/lib/db/queries';
import { ProductForm } from '@/components/admin/Forms';
import { deleteProduct } from '@/app/admin/actions';
import { METHOD_LABELS } from '@/lib/format';

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === 'new') {
    return (
      <>
        <Link href="/admin" className="text-sm text-muted">← Каталог</Link>
        <h1 className="text-2xl font-bold">Новый кофе</h1>
        <ProductForm p={{}} />
      </>
    );
  }
  const p = await getProductById(Number(id));
  if (!p) notFound();
  const rs = await listRecipes(p.id, { all: true });

  return (
    <>
      <Link href="/admin" className="text-sm text-muted">← Каталог</Link>
      <h1 className="text-2xl font-bold">{p.name}</h1>
      <ProductForm p={p} />

      <section className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Рецепты</h2>
          <Link href={`/admin/recipe/new?product=${p.id}`} className="btn btn-ghost">+ Рецепт</Link>
        </div>
        {rs.map((r) => (
          <Link key={r.id} href={`/admin/recipe/${r.id}`} className="flex justify-between rounded-xl bg-card p-3">
            <span>{r.title || METHOD_LABELS[r.method] || r.method}</span>
            <span className="text-sm text-muted">{r.isPublished ? `${r.doseG}/${r.waterG} г` : 'скрыт'}</span>
          </Link>
        ))}
      </section>

      <form action={deleteProduct.bind(null, p.id)} className="pt-6">
        <button className="text-sm text-danger">Удалить кофе вместе с рецептами</button>
      </form>
    </>
  );
}
