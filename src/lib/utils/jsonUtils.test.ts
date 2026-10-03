import { describe, expect, it } from 'vitest';
import { extractJsonFromText } from './jsonUtils';
import type { CoffeeBean } from '@/types/app';

describe('coffee bean readable text import', () => {
  it('parses structured origin and batch fields from readable text', () => {
    const bean = extractJsonFromText(`【Информация о зерне】Чирака
Обжарщик: Alo
Компоненты:
Страна: Эфиопия
Регион: Сидамо
Ферма: Бона
Станция обработки: Вока
Высота: 2100m
Обработка: Мытая
Партия: A12
Разновидность: 74158`) as Partial<CoffeeBean>;

    expect(bean.blendComponents).toEqual([
      {
        percentage: 100,
        origin: '',
        country: 'Эфиопия',
        region: 'Сидамо',
        estate: 'Бона',
        processingStation: 'Вока',
        altitude: '2100m',
        process: 'Мытая',
        batch: 'A12',
        variety: '74158',
      },
    ]);
  });
});
