import { expect, it } from 'vitest';
import { formatSteps, parseSteps } from './steps-text';

it('разбирает и собирает обратно', () => {
  const text = 'налить | 15 | 40 | Блуминг | Смочите кофе\nждать | 30 | | Ждём';
  const r = parseSteps(text);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.steps[0]).toMatchObject({ kind: 'pour', durationS: 15, targetWaterG: 40, label: 'Блуминг' });
  expect(r.steps[1]).toMatchObject({ kind: 'wait', targetWaterG: null, hint: '' });
  expect(parseSteps(formatSteps(r.steps))).toEqual(r);
});

it('понятные ошибки', () => {
  expect(parseSteps('лить | 10 | 50 | x')).toMatchObject({ ok: false });
  expect(parseSteps('налить | 10 | | x')).toMatchObject({ ok: false });
  expect(parseSteps('ждать | ноль | | x')).toMatchObject({ ok: false });
  expect(parseSteps('# только комментарий')).toMatchObject({ ok: false });
});
