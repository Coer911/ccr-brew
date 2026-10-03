import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyInitData, verifyWidget } from './telegram';

const TOKEN = '123456:TEST-token';
const NOW = 1_800_000_000;
const user = { id: 42, first_name: 'Анна', username: 'anna' };

function signInitData(fields: Record<string, string>, token = TOKEN): string {
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = createHmac('sha256', secret).update(check).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

describe('verifyInitData', () => {
  const fields = { auth_date: String(NOW - 10), query_id: 'AAA', user: JSON.stringify(user) };

  it('принимает правильную подпись', () => {
    expect(verifyInitData(signInitData(fields), TOKEN, NOW)?.id).toBe(42);
  });
  it('отвергает чужой токен', () => {
    expect(verifyInitData(signInitData(fields, '999:other'), TOKEN, NOW)).toBeNull();
  });
  it('отвергает подмену user', () => {
    const s = new URLSearchParams(signInitData(fields));
    s.set('user', JSON.stringify({ ...user, id: 1 }));
    expect(verifyInitData(s.toString(), TOKEN, NOW)).toBeNull();
  });
  it('отвергает старые данные', () => {
    const old = signInitData({ ...fields, auth_date: String(NOW - 2 * 86400) });
    expect(verifyInitData(old, TOKEN, NOW)).toBeNull();
  });
  it('отвергает пустое', () => {
    expect(verifyInitData('', TOKEN, NOW)).toBeNull();
  });
});

describe('verifyWidget', () => {
  function sign(d: Record<string, string | number>) {
    const check = Object.keys(d).sort().map((k) => `${k}=${d[k]}`).join('\n');
    const secret = createHash('sha256').update(TOKEN).digest();
    return { ...d, hash: createHmac('sha256', secret).update(check).digest('hex') };
  }
  const d = { id: 42, first_name: 'Анна', auth_date: NOW - 5 };

  it('принимает правильную подпись', () => {
    expect(verifyWidget(sign(d), TOKEN, NOW)?.id).toBe(42);
  });
  it('отвергает подмену id', () => {
    expect(verifyWidget({ ...sign(d), id: 7 }, TOKEN, NOW)).toBeNull();
  });
});
