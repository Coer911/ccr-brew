import { describe, expect, it } from 'vitest';
import type { Method } from '@/lib/core/config';
import {
  getEspressoExtractionTime,
  getEspressoParamItems,
} from './methodDisplay';

describe('espresso method display params', () => {
  it('keeps no-stage espresso params aligned with staged methods', () => {
    const method: Method = {
      name: 'Эспрессо без этапов',
      params: {
        coffee: '18g',
        water: '36g',
        ratio: '1:2',
        grindSize: 'Эспрессо',
        temp: '93°C',
        extractionTime: 25,
        stages: [],
      },
    };

    expect(getEspressoParamItems(method)).toEqual([
      'Кофе 18g',
      'Помол Эспрессо',
      'Время экстракции 25s',
      'Выход 36g',
    ]);
  });

  it('falls back for old no-stage espresso methods saved before extractionTime', () => {
    const method: Method = {
      name: 'Старый эспрессо без этапов',
      params: {
        coffee: '18g',
        water: '36',
        ratio: '1:2',
        grindSize: 'Эспрессо',
        temp: '93°C',
        stages: [],
      },
    };

    expect(getEspressoExtractionTime(method)).toBe(25);
    expect(getEspressoParamItems(method)[3]).toBe('Выход 36g');
  });
});
