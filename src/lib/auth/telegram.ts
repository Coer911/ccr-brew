import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Проверка данных, которые Telegram передаёт приложению.
// Браузеру не верим: подпись считается токеном бота только на сервере.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// https://core.telegram.org/widgets/login#checking-authorization

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const MAX_AUTH_AGE_S = 24 * 60 * 60;

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && ba.length > 0 && timingSafeEqual(ba, bb);
}

function fresh(authDate: number, nowS: number): boolean {
  return Number.isFinite(authDate) && authDate > 0 && nowS - authDate <= MAX_AUTH_AGE_S
    && authDate - nowS <= 60;
}

/** Mini App: строка Telegram.WebApp.initData. */
export function verifyInitData(
  initData: string, botToken: string, nowS = Math.floor(Date.now() / 1000),
): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (!safeEqualHex(hash, expected)) return null;
  if (!fresh(Number(params.get('auth_date')), nowS)) return null;

  try {
    const user = JSON.parse(params.get('user') ?? '') as TelegramUser;
    return typeof user?.id === 'number' ? user : null;
  } catch {
    return null;
  }
}

/** Login Widget на обычном сайте: объект полей из колбэка виджета. */
export function verifyWidget(
  data: Record<string, string | number>, botToken: string, nowS = Math.floor(Date.now() / 1000),
): TelegramUser | null {
  const { hash, ...rest } = data;
  if (typeof hash !== 'string') return null;
  const dataCheck = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (!safeEqualHex(hash, expected)) return null;
  if (!fresh(Number(rest.auth_date), nowS)) return null;

  const id = Number(rest.id);
  if (!Number.isSafeInteger(id)) return null;
  return {
    id,
    first_name: String(rest.first_name ?? ''),
    last_name: rest.last_name ? String(rest.last_name) : undefined,
    username: rest.username ? String(rest.username) : undefined,
    photo_url: rest.photo_url ? String(rest.photo_url) : undefined,
  };
}
