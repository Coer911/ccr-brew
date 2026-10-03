// Движок таймера: чистые функции без React. Идея — из brew-guide
// (рецепт = список этапов с длительностью), код свой.

export type StepKind = 'pour' | 'wait' | 'stir' | 'press';

export interface Step {
  kind: StepKind;
  label: string;
  hint: string;
  durationS: number;
  /** Сколько воды всего должно быть к концу этапа (только pour). */
  targetWaterG: number | null;
}

export interface TimerSnapshot {
  elapsedS: number;
  totalS: number;
  /** Индекс текущего этапа; steps.length — всё закончено. */
  index: number;
  step: Step | null;
  next: Step | null;
  stepElapsedS: number;
  stepRemainingS: number;
  /** 0..1 */
  stepProgress: number;
  /** Сколько воды должно быть в чашке/воронке прямо сейчас. */
  waterNowG: number;
  done: boolean;
}

export function totalDuration(steps: readonly Step[]): number {
  return steps.reduce((s, x) => s + Math.max(0, x.durationS), 0);
}

/** Начало каждого этапа в секундах от старта. */
export function stepStarts(steps: readonly Step[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (const s of steps) {
    out.push(t);
    t += Math.max(0, s.durationS);
  }
  return out;
}

export function snapshot(steps: readonly Step[], elapsedS: number): TimerSnapshot {
  const totalS = totalDuration(steps);
  const e = Math.max(0, elapsedS);
  const starts = stepStarts(steps);

  let index = steps.length;
  for (let i = 0; i < steps.length; i++) {
    if (e < starts[i] + Math.max(0, steps[i].durationS)) { index = i; break; }
  }

  const done = index >= steps.length;
  const step = done ? null : steps[index];
  const stepElapsedS = done ? 0 : e - starts[index];
  const dur = step ? Math.max(0, step.durationS) : 0;
  const stepProgress = dur > 0 ? Math.min(1, stepElapsedS / dur) : 1;

  return {
    elapsedS: e,
    totalS,
    index,
    step,
    next: done ? null : steps[index + 1] ?? null,
    stepElapsedS,
    stepRemainingS: done ? 0 : Math.max(0, dur - stepElapsedS),
    stepProgress,
    waterNowG: waterAt(steps, index, stepProgress),
    done,
  };
}

/** Вода, накопленная к этапу index, плюс линейно наливаемая доля текущего pour. */
function waterAt(steps: readonly Step[], index: number, progress: number): number {
  let before = 0;
  for (let i = 0; i < Math.min(index, steps.length); i++) {
    const w = steps[i].targetWaterG;
    if (w != null) before = w;
  }
  if (index >= steps.length) return before;
  const cur = steps[index];
  if (cur.kind !== 'pour' || cur.targetWaterG == null) return before;
  return Math.round(before + (cur.targetWaterG - before) * progress);
}

/**
 * Часы таймера. Время считается от момента старта (Date.now),
 * а не прибавлением секунд в setInterval — тот отстаёт в фоне.
 */
export interface Clock {
  startedAt: number | null;
  pausedAt: number | null;
  pausedTotalMs: number;
}

export const idleClock = (): Clock => ({ startedAt: null, pausedAt: null, pausedTotalMs: 0 });

export function start(now: number): Clock {
  return { startedAt: now, pausedAt: null, pausedTotalMs: 0 };
}

export function pause(c: Clock, now: number): Clock {
  if (c.startedAt == null || c.pausedAt != null) return c;
  return { ...c, pausedAt: now };
}

export function resume(c: Clock, now: number): Clock {
  if (c.pausedAt == null) return c;
  return { ...c, pausedAt: null, pausedTotalMs: c.pausedTotalMs + (now - c.pausedAt) };
}

export function elapsedS(c: Clock, now: number): number {
  if (c.startedAt == null) return 0;
  const end = c.pausedAt ?? now;
  return Math.max(0, (end - c.startedAt - c.pausedTotalMs) / 1000);
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
