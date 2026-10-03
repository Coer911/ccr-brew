import { webhookCallback } from 'grammy';
import { getBot } from '@/lib/bot/bot';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.BOT_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('forbidden', { status: 403 });
  }
  return webhookCallback(getBot(), 'std/http')(req);
}
