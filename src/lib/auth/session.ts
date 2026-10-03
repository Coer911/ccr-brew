import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'brew_session';
const MAX_AGE_S = 60 * 60 * 24 * 30;

export interface Session {
  userId: number;
  telegramId: number;
}

function key(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET не задан или короче 32 символов');
  return new TextEncoder().encode(s);
}

export async function createSession(s: Session): Promise<void> {
  const token = await new SignJWT({ tid: s.telegramId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(s.userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(key());
  const prod = process.env.NODE_ENV === 'production';
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Mini App на части клиентов — это iframe: нужен SameSite=None + Secure.
    secure: prod,
    sameSite: prod ? 'none' : 'lax',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    const userId = Number(payload.sub);
    const telegramId = Number(payload.tid);
    if (!Number.isSafeInteger(userId) || !Number.isSafeInteger(telegramId)) return null;
    return { userId, telegramId };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export function adminIds(): Set<number> {
  return new Set(
    (process.env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((x) => Number(x.trim())).filter((x) => x > 0),
  );
}

export function isAdmin(s: Session | null): boolean {
  return !!s && adminIds().has(s.telegramId);
}
