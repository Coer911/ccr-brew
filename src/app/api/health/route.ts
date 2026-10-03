import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { publicUrl } from '@/lib/bot/bot';

export const dynamic = 'force-dynamic';

// 200 — всё настроено, 503 — список того, чего не хватает (как у superbot).
export async function GET() {
  const missing: string[] = [];
  if (!process.env.BOT_TOKEN) missing.push('BOT_TOKEN');
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if ((process.env.SESSION_SECRET ?? '').length < 32) missing.push('SESSION_SECRET');
  if (!publicUrl()) missing.push('PUBLIC_URL');
  if (!process.env.ADMIN_TELEGRAM_IDS) missing.push('ADMIN_TELEGRAM_IDS');

  let db = 'down';
  if (process.env.DATABASE_URL) {
    try {
      await getDb().execute(sql`select 1`);
      db = 'up';
    } catch {
      missing.push('database');
    }
  }
  const ok = missing.length === 0;
  return NextResponse.json({ ok, db, missing }, { status: ok ? 200 : 503 });
}
