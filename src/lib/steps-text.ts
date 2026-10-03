import type { Step, StepKind } from './timer/stages';

// Этапы рецепта в админке — простым текстом, по строке на этап:
//   действие | секунд | вода к концу этапа, г | название | подсказка
//   налить   | 15     | 40                    | Блуминг  | Смочите весь кофе
//   ждать    | 30     |                       | Ждём
// Действия: налить, ждать, помешать, прессовать (или pour, wait, stir, press).

const KINDS: Record<string, StepKind> = {
  pour: 'pour', налить: 'pour', пролив: 'pour',
  wait: 'wait', ждать: 'wait', пауза: 'wait',
  stir: 'stir', помешать: 'stir', покачать: 'stir',
  press: 'press', прессовать: 'press', поршень: 'press',
};
const KIND_RU: Record<StepKind, string> = { pour: 'налить', wait: 'ждать', stir: 'помешать', press: 'прессовать' };

export type ParseResult = { ok: true; steps: Step[] } | { ok: false; error: string };

export function parseSteps(text: string): ParseResult {
  const steps: Step[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const [kindRaw = '', secRaw = '', waterRaw = '', label = '', ...hint] = line.split('|').map((x) => x.trim());
    const n = i + 1;
    const kind = KINDS[kindRaw.toLowerCase()];
    if (!kind) return { ok: false, error: `Строка ${n}: непонятное действие «${kindRaw}»` };
    const durationS = Number(secRaw);
    if (!Number.isInteger(durationS) || durationS <= 0 || durationS > 3600) {
      return { ok: false, error: `Строка ${n}: секунды должны быть целым числом от 1 до 3600` };
    }
    let targetWaterG: number | null = null;
    if (waterRaw) {
      targetWaterG = Number(waterRaw);
      if (!Number.isInteger(targetWaterG) || targetWaterG <= 0 || targetWaterG > 5000) {
        return { ok: false, error: `Строка ${n}: вода — целое число граммов` };
      }
    }
    if (kind === 'pour' && targetWaterG == null) {
      return { ok: false, error: `Строка ${n}: для «налить» укажите, сколько воды будет к концу этапа` };
    }
    if (!label) return { ok: false, error: `Строка ${n}: нет названия этапа` };
    steps.push({ kind, durationS, targetWaterG, label, hint: hint.join('|') });
  }
  if (steps.length === 0) return { ok: false, error: 'Нужен хотя бы один этап' };
  return { ok: true, steps };
}

export function formatSteps(steps: readonly Step[]): string {
  return steps
    .map((s) => [KIND_RU[s.kind], s.durationS, s.targetWaterG ?? '', s.label, s.hint].join(' | ').replace(/[ |]+$/, ''))
    .join('\n');
}
