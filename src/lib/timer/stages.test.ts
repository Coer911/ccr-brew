import { describe, expect, it } from 'vitest';
import { elapsedS, formatTime, pause, resume, snapshot, start, type Step } from './stages';

const v60: Step[] = [
  { kind: 'pour', label: 'Блуминг', hint: '', durationS: 30, targetWaterG: 50 },
  { kind: 'wait', label: 'Ждём', hint: '', durationS: 15, targetWaterG: null },
  { kind: 'pour', label: 'Второй пролив', hint: '', durationS: 30, targetWaterG: 250 },
  { kind: 'wait', label: 'Стекание', hint: '', durationS: 60, targetWaterG: null },
];

describe('snapshot', () => {
  it('в начале — первый этап, воды 0', () => {
    const s = snapshot(v60, 0);
    expect(s.index).toBe(0);
    expect(s.waterNowG).toBe(0);
    expect(s.totalS).toBe(135);
    expect(s.next?.label).toBe('Ждём');
  });

  it('середина пролива — вода наливается линейно', () => {
    expect(snapshot(v60, 15).waterNowG).toBe(25);
    expect(snapshot(v60, 60).waterNowG).toBe(150);
  });

  it('на ожидании держит воду предыдущего пролива', () => {
    const s = snapshot(v60, 40);
    expect(s.index).toBe(1);
    expect(s.waterNowG).toBe(50);
    expect(s.stepRemainingS).toBe(5);
  });

  it('граница этапа переходит на следующий', () => {
    expect(snapshot(v60, 30).index).toBe(1);
  });

  it('после конца — done и вся вода', () => {
    const s = snapshot(v60, 999);
    expect(s.done).toBe(true);
    expect(s.step).toBeNull();
    expect(s.waterNowG).toBe(250);
  });

  it('пустой рецепт сразу done', () => {
    expect(snapshot([], 0).done).toBe(true);
  });
});

describe('clock', () => {
  it('пауза не идёт в зачёт', () => {
    let c = start(1000);
    c = pause(c, 11_000);           // 10 с
    expect(elapsedS(c, 50_000)).toBe(10);
    c = resume(c, 20_000);          // пауза 9 с
    expect(elapsedS(c, 25_000)).toBe(15);
  });
});

it('formatTime', () => {
  expect(formatTime(0)).toBe('0:00');
  expect(formatTime(75.9)).toBe('1:15');
});
