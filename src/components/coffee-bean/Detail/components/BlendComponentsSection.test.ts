import { describe, expect, it } from 'vitest';
import { buildBlendComponentDisplayRows } from './BlendComponentsSection';

describe('buildBlendComponentDisplayRows', () => {
  it('groups multiple blend components by field order', () => {
    const rows = buildBlendComponentDisplayRows([
      {
        country: 'Эфиопия',
        estate: 'Банчи Маджи',
        processingStation: 'Вока',
        process: 'Мытая',
        variety: '74158',
        percentage: 60,
      },
      {
        country: 'Кения',
        estate: 'Киамбу',
        process: 'Натуральная',
        variety: 'SL28',
        percentage: 40,
      },
    ]);

    expect(
      rows.map(row => ({
        field: row.field,
        label: row.label,
        values: row.entries.map(entry => entry.value),
      }))
    ).toEqual([
      {
        field: 'country',
        label: 'Страна',
        values: ['Эфиопия', 'Кения'],
      },
      {
        field: 'estate',
        label: 'Ферма',
        values: ['Банчи Маджи', 'Киамбу'],
      },
      { field: 'processingStation', label: 'Станция обработки', values: ['Вока'] },
      { field: 'process', label: 'Обработка', values: ['Мытая', 'Натуральная'] },
      { field: 'variety', label: 'Разновидность', values: ['74158', 'SL28'] },
      { field: 'percentage', label: 'Доля', values: ['60%', '40%'] },
    ]);
  });

  it('keeps legacy origin only for components without structured origin data', () => {
    const rows = buildBlendComponentDisplayRows([
      { origin: 'Колумбия Уила', process: 'Мытая' },
      {
        origin: 'Старый регион',
        country: 'Эфиопия',
        region: 'Сидамо',
        process: 'Натуральная',
      },
    ]);

    expect(rows.find(row => row.field === 'origin')?.entries).toEqual([
      { componentIndex: 0, value: 'Колумбия Уила' },
    ]);
  });
});
