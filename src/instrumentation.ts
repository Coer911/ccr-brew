// Next.js вызывает register() один раз при старте сервера.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  if (process.env.DATABASE_URL) {
    try {
      const { bootstrapDb } = await import('./lib/db/bootstrap');
      await bootstrapDb();
    } catch (e) {
      console.error('[brew] миграции не применились', e);
    }
  }
  try {
    const { setupBot } = await import('./lib/bot/bot');
    await setupBot();
  } catch (e) {
    console.error('[brew] бот не настроился', e);
  }
}
