import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { listBrews } from '@/lib/db/queries';
import { formatTime } from '@/lib/timer/stages';
import { formatDate, METHOD_LABELS } from '@/lib/format';
import { LoginWidget } from '@/components/LoginWidget';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="space-y-4 pt-6 text-center">
        <h1 className="text-2xl font-bold">Журнал</h1>
        <p className="text-muted">Здесь будут ваши заварки и оценки. Войдите через Telegram.</p>
        <LoginWidget botUsername={process.env.BOT_USERNAME || 'Brewing_ccrbot'} />
      </div>
    );
  }
  const items = await listBrews(session.userId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Журнал</h1>
      {items.length === 0 && (
        <p className="text-muted">Пока пусто. <Link href="/" className="underline">Выберите кофе</Link> и заварите первую чашку.</p>
      )}
      <ul className="space-y-3">
        {items.map((b) => {
          const p = b.params as { method?: string; title?: string; doseG?: number; waterG?: number };
          return (
            <li key={b.id} className="rounded-2xl bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-semibold">
                  {b.productSlug ? <Link href={`/coffee/${b.productSlug}`}>{b.productName}</Link> : 'Кофе удалён'}
                </div>
                {b.rating != null && <div className="text-accent">{'★'.repeat(b.rating)}</div>}
              </div>
              <div className="text-sm text-muted">
                {formatDate(b.createdAt)} · {p.title || METHOD_LABELS[p.method ?? ''] || p.method}
                {p.doseG ? ` · ${p.doseG} г / ${p.waterG} г` : ''}
                {b.actualTimeS != null ? ` · ${formatTime(b.actualTimeS)}` : ''}
              </div>
              {b.taste.length > 0 && <div className="mt-1 text-sm">{b.taste.join(', ')}</div>}
              {b.note && <p className="mt-1 whitespace-pre-line text-sm">{b.note}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
