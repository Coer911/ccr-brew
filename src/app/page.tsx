import Link from 'next/link';
import { listProducts } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const items = await listProducts();
  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Cultura Coffee</h1>
        <p className="text-muted">Выберите кофе — подскажем, как его заварить.</p>
      </header>
      {items.length === 0 && <p className="text-muted">Каталог пока пуст.</p>}
      <ul className="grid gap-3">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/coffee/${p.slug}`} className="flex gap-3 rounded-2xl bg-card p-3 active:opacity-80">
              {p.imageUrl
                ? <img src={p.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-bg text-3xl">☕</div>}
              <div className="min-w-0">
                <div className="font-semibold">{p.name}</div>
                <div className="truncate text-sm text-muted">
                  {[p.origin, p.process, p.roastLevel && `обжарка: ${p.roastLevel.toLowerCase()}`].filter(Boolean).join(' · ')}
                </div>
                {p.flavorNotes.length > 0 && (
                  <div className="mt-1 text-sm">{p.flavorNotes.join(', ')}</div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
