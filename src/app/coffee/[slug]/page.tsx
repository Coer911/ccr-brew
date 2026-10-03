import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, listRecipes } from '@/lib/db/queries';
import { METHOD_ICONS, METHOD_LABELS, ratio } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CoffeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p || !p.isPublished) notFound();
  const rs = await listRecipes(p.id);

  const facts = [
    ['Происхождение', p.origin], ['Обработка', p.process],
    ['Разновидность', p.variety], ['Обжарка', p.roastLevel],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted">← Все кофе</Link>
      {p.imageUrl && <img src={p.imageUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
      <div>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        {p.flavorNotes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {p.flavorNotes.map((n) => (
              <span key={n} className="rounded-full bg-card px-3 py-1 text-sm">{n}</span>
            ))}
          </div>
        )}
      </div>
      {p.description && <p className="whitespace-pre-line leading-relaxed">{p.description}</p>}
      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-card p-4 text-sm">
          {facts.map(([k, v]) => (
            <div key={k}><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
      )}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Как заварить</h2>
        {rs.length === 0 && <p className="text-muted">Рецепты скоро появятся.</p>}
        {rs.map((r) => (
          <Link key={r.id} href={`/brew/${r.id}`}
            className="flex items-center gap-3 rounded-2xl bg-card p-4 active:opacity-80">
            <span className="text-2xl">{METHOD_ICONS[r.method] ?? '☕'}</span>
            <div className="flex-1">
              <div className="font-semibold">{r.title || METHOD_LABELS[r.method] || r.method}</div>
              <div className="text-sm text-muted">
                {r.doseG} г · {r.waterG} г воды · {ratio(r.doseG, r.waterG)} · {r.tempC}°C
              </div>
            </div>
            <span className="text-muted">›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
