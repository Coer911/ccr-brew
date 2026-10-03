import Link from 'next/link';
import { listProducts } from '@/lib/db/queries';

export default async function AdminPage() {
  const items = await listProducts({ all: true });
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Каталог</h1>
        <Link href="/admin/product/new" className="btn">+ Кофе</Link>
      </div>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/product/${p.id}`} className="flex justify-between rounded-xl bg-card p-3">
              <span>{p.name}</span>
              <span className="text-sm text-muted">{p.isPublished ? `#${p.sortOrder}` : 'скрыт'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
