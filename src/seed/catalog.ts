// Демо-каталог: заливается при первом старте, если brew_products пуст.
// Это заглушки — замените через /admin, когда будет настоящий контент.

export interface SeedStep {
  kind: 'pour' | 'wait' | 'stir' | 'press';
  durationS: number;
  targetWaterG?: number;
  label: string;
  hint?: string;
}
export interface SeedRecipe {
  method: string; title: string; doseG: number; waterG: number; tempC: number;
  grind: string; note?: string; steps: SeedStep[];
}
export interface SeedProduct {
  slug: string; name: string; description: string; origin: string; process: string;
  variety: string; roastLevel: string; flavorNotes: string[]; recipes: SeedRecipe[];
}

const v60: SeedRecipe = {
  method: 'v60', title: 'Воронка V60', doseG: 15, waterG: 250, tempC: 93,
  grind: 'Средне-мелкий, как мелкая соль',
  steps: [
    { kind: 'pour', durationS: 15, targetWaterG: 40, label: 'Блуминг', hint: 'Смочите весь кофе, лёгкими кругами' },
    { kind: 'wait', durationS: 30, label: 'Ждём', hint: 'Кофе «дышит» и отдаёт газ' },
    { kind: 'pour', durationS: 30, targetWaterG: 150, label: 'Второй пролив', hint: 'Медленно, по спирали от центра' },
    { kind: 'pour', durationS: 30, targetWaterG: 250, label: 'Третий пролив', hint: 'Не лейте на стенки' },
    { kind: 'stir', durationS: 5, label: 'Покачать воронку', hint: 'Слой кофе выровняется' },
    { kind: 'wait', durationS: 70, label: 'Стекание', hint: 'Цель — закончить к 3:00' },
  ],
};

const frenchPress: SeedRecipe = {
  method: 'french_press', title: 'Френч-пресс', doseG: 18, waterG: 300, tempC: 94,
  grind: 'Крупный, как морская соль',
  steps: [
    { kind: 'pour', durationS: 20, targetWaterG: 300, label: 'Залить всю воду', hint: 'Равномерно по всему кофе' },
    { kind: 'wait', durationS: 220, label: 'Настаиваем', hint: 'Крышку положите, поршень не опускайте' },
    { kind: 'stir', durationS: 15, label: 'Разбить корку', hint: 'Ложкой, снимите пену' },
    { kind: 'press', durationS: 20, label: 'Опустить поршень', hint: 'Медленно, без усилия' },
  ],
};

const espresso: SeedRecipe = {
  method: 'espresso', title: 'Эспрессо', doseG: 18, waterG: 36, tempC: 93,
  grind: 'Мелкий, подбирается под 25–30 с', note: 'Соотношение 1:2',
  steps: [
    { kind: 'pour', durationS: 28, targetWaterG: 36, label: 'Экстракция', hint: 'Цель — 36 г в чашке за 25–30 с' },
  ],
};

export const seedCatalog: SeedProduct[] = [
  {
    slug: 'ethiopia-demo', name: 'Эфиопия (демо)',
    description: 'Пример карточки. Замените в админке на реальный кофе.',
    origin: 'Эфиопия, Иргачефф', process: 'Мытая', variety: 'Heirloom', roastLevel: 'Светлая',
    flavorNotes: ['жасмин', 'бергамот', 'персик'], recipes: [v60, frenchPress],
  },
  {
    slug: 'brazil-demo', name: 'Бразилия (демо)',
    description: 'Пример карточки. Замените в админке на реальный кофе.',
    origin: 'Бразилия, Серрадо', process: 'Натуральная', variety: 'Mundo Novo', roastLevel: 'Средняя',
    flavorNotes: ['шоколад', 'орех', 'карамель'], recipes: [espresso, frenchPress],
  },
];
