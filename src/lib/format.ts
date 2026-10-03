export const METHOD_LABELS: Record<string, string> = {
  v60: 'Воронка V60', kalita: 'Kalita Wave', origami: 'Origami', chemex: 'Кемекс',
  french_press: 'Френч-пресс', aeropress: 'Аэропресс', espresso: 'Эспрессо',
  moka: 'Гейзерная кофеварка', cezve: 'Турка', clever: 'Clever',
};

export const METHOD_ICONS: Record<string, string> = {
  v60: '🔻', kalita: '🔻', origami: '🔻', chemex: '⏳', french_press: '🫖',
  aeropress: '🧪', espresso: '☕', moka: '🫕', cezve: '🏺', clever: '🔻',
};

export function ratio(doseG: number, waterG: number): string {
  if (!doseG) return '—';
  const r = waterG / doseG;
  return `1:${Number.isInteger(r) ? r : r.toFixed(1)}`;
}

export const TASTES = [
  'сладко', 'сбалансированно', 'кисло', 'горько', 'водянисто', 'плотно',
  'ярко', 'терпко', 'фруктово', 'шоколадно', 'орехово', 'цветочно',
];

export function formatDate(d: Date): string {
  return d.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
  });
}
