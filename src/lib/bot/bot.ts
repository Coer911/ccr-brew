import { Bot, InlineKeyboard } from 'grammy';

// Бот нужен только как вход: /start → кнопка «Открыть», плюс кнопка меню.
// Работает через вебхук /api/bot/webhook, отдельного процесса нет.

const g = globalThis as unknown as { brewBot?: Bot };

export function publicUrl(): string | null {
  const u = process.env.PUBLIC_URL?.trim().replace(/\/+$/, '');
  return u && u.startsWith('https://') ? u : null;
}

export function getBot(): Bot {
  if (g.brewBot) return g.brewBot;
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN не задан');
  const bot = new Bot(token);

  bot.command('start', async (ctx) => {
    const base = publicUrl();
    if (!base) {
      await ctx.reply('Приложение ещё настраивается. Загляните чуть позже ☕');
      return;
    }
    // /start <slug> — сразу на нужный кофе.
    const slug = (ctx.match ?? '').trim();
    const url = /^[a-z0-9-]{1,64}$/.test(slug) ? `${base}/coffee/${slug}` : base;
    await ctx.reply(
      'Привет! Здесь рецепты заваривания кофе Cultura Coffee: выберите кофе, '
        + 'заварите по таймеру и сохраните оценку.',
      { reply_markup: new InlineKeyboard().webApp('☕ Открыть приложение', url) },
    );
  });

  bot.on('message', (ctx) => ctx.reply('Нажмите /start, чтобы открыть приложение.'));
  bot.catch((e) => console.error('[brew] bot error', e.error));

  g.brewBot = bot;
  return bot;
}

/** Ставит вебхук и кнопку меню. Идемпотентно, вызывается при старте. */
export async function setupBot(): Promise<void> {
  const base = publicUrl();
  if (!process.env.BOT_TOKEN || !base) {
    console.warn('[brew] BOT_TOKEN или PUBLIC_URL (https) не заданы — бот не настроен');
    return;
  }
  const bot = getBot();
  await bot.api.setWebhook(`${base}/api/bot/webhook`, {
    secret_token: process.env.BOT_WEBHOOK_SECRET || undefined,
    allowed_updates: ['message'],
  });
  await bot.api.setChatMenuButton({
    menu_button: { type: 'web_app', text: 'Рецепты', web_app: { url: base } },
  });
  await bot.api.setMyCommands([{ command: 'start', description: 'Открыть приложение' }]);
  console.log(`[brew] бот настроен: вебхук ${base}/api/bot/webhook`);
}
