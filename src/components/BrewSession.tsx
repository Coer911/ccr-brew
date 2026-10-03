'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  elapsedS, formatTime, idleClock, pause, resume, snapshot, start, type Clock,
} from '@/lib/timer/stages';
import type { RecipeWithSteps } from '@/lib/db/queries';
import { METHOD_LABELS, TASTES, ratio } from '@/lib/format';
import { saveBrew } from '@/app/actions';
import { LoginWidget } from './LoginWidget';

type Phase = 'ready' | 'brewing' | 'rate' | 'saved';

const KIND_ICON = { pour: '💧', wait: '⏳', stir: '🥄', press: '⬇️' } as const;

function haptic(kind: 'step' | 'done') {
  const h = window.Telegram?.WebApp?.HapticFeedback;
  if (h) {
    if (kind === 'done') h.notificationOccurred('success'); else h.impactOccurred('heavy');
  } else {
    navigator.vibrate?.(kind === 'done' ? [80, 60, 80] : 60);
  }
}

function beep(ctx: AudioContext | null, freq: number) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.25);
}

export function BrewSession({ recipe, productName, loggedIn, botUsername }: {
  recipe: RecipeWithSteps; productName: string; loggedIn: boolean; botUsername: string;
}) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [clock, setClock] = useState<Clock>(idleClock);
  const [now, setNow] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const lastIndex = useRef(0);

  const snap = snapshot(recipe.steps, elapsedS(clock, now));
  const running = phase === 'brewing' && clock.pausedAt == null;

  // Тик ~4 раза в секунду; само время — от Date.now, поэтому не отстаёт.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  // Экран не гаснет и свайп не закрывает Mini App, пока идёт заварка.
  useEffect(() => {
    if (phase !== 'brewing') return;
    const wa = window.Telegram?.WebApp;
    wa?.disableVerticalSwipes?.();
    const lock = () => navigator.wakeLock?.request('screen')
      .then((l) => { wakeLock.current = l; }).catch(() => {});
    lock();
    const onVis = () => { if (document.visibilityState === 'visible') lock(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
      wa?.enableVerticalSwipes?.();
    };
  }, [phase]);

  const finish = useCallback((t: number) => {
    setFinalTime(Math.round(t));
    setPhase('rate');
    haptic('done');
    beep(audio.current, 1046);
  }, []);

  // Сигнал на смене этапа и в конце.
  useEffect(() => {
    if (phase !== 'brewing') return;
    if (snap.done) { finish(snap.totalS); return; }
    if (snap.index !== lastIndex.current) {
      lastIndex.current = snap.index;
      haptic('step');
      beep(audio.current, 784);
    }
  }, [phase, snap.index, snap.done, snap.totalS, finish]);

  function onStart() {
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch { /* без звука */ }
    const t = Date.now();
    lastIndex.current = 0;
    setClock(start(t));
    setNow(t);
    setPhase('brewing');
    haptic('step');
  }

  function onPauseResume() {
    const t = Date.now();
    setClock((c) => (c.pausedAt == null ? pause(c, t) : resume(c, t)));
    setNow(t);
  }

  const method = METHOD_LABELS[recipe.method] ?? recipe.method;

  if (phase === 'ready') {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{recipe.title || method}</h1>
          <p className="text-muted">{productName}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Кофе', `${recipe.doseG} г`], ['Вода', `${recipe.waterG} г`], ['Пропорция', ratio(recipe.doseG, recipe.waterG)],
            ['Температура', `${recipe.tempC}°C`], ['Время', formatTime(snap.totalS)], ['Этапов', String(recipe.steps.length)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-card p-3">
              <div className="text-lg font-semibold">{v}</div>
              <div className="text-xs text-muted">{k}</div>
            </div>
          ))}
        </div>
        {recipe.grind && <p className="rounded-xl bg-card p-3 text-sm"><b>Помол:</b> {recipe.grind}</p>}
        {recipe.note && <p className="text-sm text-muted">{recipe.note}</p>}
        <ol className="space-y-2">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span>{KIND_ICON[s.kind] ?? '•'}</span>
              <span className="flex-1">
                <b>{s.label}</b>
                {s.targetWaterG != null && <> — до {s.targetWaterG} г</>}
                {s.hint && <span className="block text-muted">{s.hint}</span>}
              </span>
              <span className="tabular-nums text-muted">{formatTime(s.durationS)}</span>
            </li>
          ))}
        </ol>
        <button className="btn w-full text-lg" onClick={onStart} disabled={recipe.steps.length === 0}>
          ▶ Начать
        </button>
      </div>
    );
  }

  if (phase === 'brewing') {
    const s = snap.step;
    return (
      <div className="flex min-h-[70dvh] flex-col gap-5">
        <div className="text-center">
          <div className="text-sm text-muted">Этап {Math.min(snap.index + 1, recipe.steps.length)} из {recipe.steps.length}</div>
          <div className="mt-1 text-6xl font-bold tabular-nums">{formatTime(snap.elapsedS)}</div>
          <div className="text-sm text-muted">из {formatTime(snap.totalS)}</div>
        </div>

        {s && (
          <div className="rounded-3xl bg-card p-5 text-center">
            <div className="text-4xl">{KIND_ICON[s.kind] ?? '•'}</div>
            <div className="mt-2 text-2xl font-semibold">{s.label}</div>
            {s.hint && <div className="mt-1 text-muted">{s.hint}</div>}
            {s.targetWaterG != null && (
              <div className="mt-4">
                <div className="text-5xl font-bold tabular-nums">{snap.waterNowG} г</div>
                <div className="text-sm text-muted">цель этапа — {s.targetWaterG} г</div>
              </div>
            )}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg">
              <div className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round(snap.stepProgress * 100)}%` }} />
            </div>
            <div className="mt-2 text-sm tabular-nums text-muted">осталось {formatTime(Math.ceil(snap.stepRemainingS))}</div>
          </div>
        )}

        {snap.next && (
          <div className="text-center text-sm text-muted">
            Дальше: {snap.next.label}{snap.next.targetWaterG != null && ` — до ${snap.next.targetWaterG} г`}
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button className="btn btn-ghost" onClick={onPauseResume}>
            {clock.pausedAt == null ? '⏸ Пауза' : '▶ Дальше'}
          </button>
          <button className="btn" onClick={() => finish(snap.elapsedS)}>✓ Готово</button>
        </div>
      </div>
    );
  }

  if (phase === 'saved') {
    return (
      <div className="space-y-4 pt-8 text-center">
        <p className="text-5xl">☕</p>
        <p className="text-xl font-semibold">Записали в журнал</p>
        <div className="flex flex-col gap-2">
          <Link href="/journal" className="btn">Открыть журнал</Link>
          <button className="btn btn-ghost" onClick={() => { setClock(idleClock()); setPhase('ready'); }}>
            Заварить ещё раз
          </button>
        </div>
      </div>
    );
  }

  return <RateForm recipeId={recipe.id} timeS={finalTime} loggedIn={loggedIn}
    botUsername={botUsername} onSaved={() => setPhase('saved')} />;
}

function RateForm({ recipeId, timeS, loggedIn, botUsername, onSaved }: {
  recipeId: number; timeS: number | null; loggedIn: boolean; botUsername: string; onSaved: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [taste, setTaste] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await saveBrew({ recipeId, actualTimeS: timeS, rating, taste, note }).catch(() => null);
    setBusy(false);
    if (r?.ok) onSaved();
    else setError(r?.error === 'auth' ? 'Нужно войти через Telegram.' : 'Не получилось сохранить.');
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-muted">Заварка заняла</p>
        <p className="text-4xl font-bold tabular-nums">{formatTime(timeS ?? 0)}</p>
      </div>

      <div>
        <p className="label">Как вам?</p>
        <div className="flex justify-center gap-2 text-4xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} aria-label={`${n} из 5`} onClick={() => setRating(n)}
              className={rating != null && n <= rating ? '' : 'opacity-30 grayscale'}>★</button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Вкус</p>
        <div className="flex flex-wrap gap-2">
          {TASTES.map((t) => {
            const on = taste.includes(t);
            return (
              <button key={t} onClick={() => setTaste(on ? taste.filter((x) => x !== t) : [...taste, t])}
                className={`rounded-full px-3 py-1.5 text-sm ${on ? 'bg-accent text-accent-fg' : 'bg-card'}`}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">Заметка</label>
        <textarea id="note" className="input min-h-24" value={note} maxLength={2000}
          onChange={(e) => setNote(e.target.value)} placeholder="Что поменять в следующий раз?" />
      </div>

      {loggedIn ? (
        <button className="btn w-full" onClick={submit} disabled={busy}>
          {busy ? 'Сохраняем…' : 'Сохранить в журнал'}
        </button>
      ) : (
        <div className="space-y-2 rounded-2xl bg-card p-4 text-center">
          <p className="text-sm">Чтобы сохранить в журнал, войдите через Telegram.</p>
          <LoginWidget botUsername={botUsername} />
        </div>
      )}
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
