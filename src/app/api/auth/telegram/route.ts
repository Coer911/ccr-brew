import { NextResponse } from 'next/server';
import { verifyInitData, verifyWidget, type TelegramUser } from '@/lib/auth/telegram';
import { createSession } from '@/lib/auth/session';
import { upsertUser } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// Тело: { initData: string } из Mini App или { widget: {...} } из Login Widget.
export async function POST(req: Request) {
  const token = process.env.BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });

  let body: { initData?: unknown; widget?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  let tg: TelegramUser | null = null;
  if (typeof body.initData === 'string') {
    tg = verifyInitData(body.initData, token);
  } else if (body.widget && typeof body.widget === 'object') {
    tg = verifyWidget(body.widget as Record<string, string | number>, token);
  }
  if (!tg) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 401 });

  const user = await upsertUser(tg);
  await createSession({ userId: user.id, telegramId: user.telegramId });
  return NextResponse.json({ ok: true, name: user.firstName });
}
