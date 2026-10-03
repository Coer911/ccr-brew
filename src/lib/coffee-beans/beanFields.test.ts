import { describe, expect, it } from 'vitest';
import {
  getComponentFieldValue,
  getComponentOriginDisplay,
  normalizeCoffeeBeanForFieldConfig,
  resolveBeanFieldConfig,
  type BeanFieldId,
} from './beanFields';
import type { CoffeeBean } from '@/types/app';
import type { AppSettings } from '@/lib/core/db';

const buildBean = (bean: Partial<CoffeeBean>): CoffeeBean => ({
  id: 'bean',
  timestamp: 1,
  name: 'Test Bean',
  ...bean,
});

const settingsWithEnabledFields = (
  enabledIds: BeanFieldId[]
): Pick<AppSettings, 'beanFieldConfig'> => ({
  beanFieldConfig: {
    version: 1,
    fields: enabledIds.map((id, index) => ({
      id,
      enabled: true,
      order: index,
    })),
  },
});

describe('bean field configuration', () => {
  it('keeps legacy origin/process/variety as the default compatible fields', () => {
    const config = resolveBeanFieldConfig();
    expect(
      config.fields.filter(field => field.enabled).map(field => field.id)
    ).toEqual(['origin', 'process', 'variety']);
    expect(
      config.fields.find(field => field.id === 'processingStation')
    ).toEqual({
      id: 'processingStation',
      enabled: false,
      order: 4,
    });
  });

  it('inherits the legacy estate toggle when no explicit config exists', () => {
    const config = resolveBeanFieldConfig({ showEstateField: true });
    expect(
      config.fields.filter(field => field.enabled).map(field => field.id)
    ).toEqual(['origin', 'estate', 'process', 'variety']);
  });

  it('moves disabled component fields into notes during import normalization', () => {
    const normalized = normalizeCoffeeBeanForFieldConfig(
      buildBean({
        blendComponents: [
          {
            origin: 'Эфиопия',
            country: 'Конго',
            region: 'Конго',
            estate: 'Бона',
            processingStation: 'Вока',
            process: 'Мытая',
            variety: '74158',
            altitude: '2100m',
            batch: '1931',
          },
        ],
      }),
      settingsWithEnabledFields(['origin', 'process', 'variety'])
    );

    expect(normalized.blendComponents).toEqual([
      {
        origin: 'Эфиопия',
        process: 'Мытая',
        variety: '74158',
      },
    ]);
    expect(normalized.notes).toBe(
      'Страна: Конго / Регион: Конго / Ферма: Бона / Станция обработки: Вока / Высота: 2100m / Партия: 1931'
    );
  });

  it('keeps estate structured when the user enables it', () => {
    const normalized = normalizeCoffeeBeanForFieldConfig(
      buildBean({
        blendComponents: [
          {
            origin: 'Эфиопия',
            estate: 'Бона',
            process: 'Мытая',
          },
        ],
      }),
      settingsWithEnabledFields(['origin', 'estate', 'process'])
    );

    expect(normalized.blendComponents).toEqual([
      {
        origin: 'Эфиопия',
        estate: 'Бона',
        process: 'Мытая',
      },
    ]);
    expect(normalized.notes).toBeUndefined();
  });

  it('keeps processing station structured only when explicitly enabled', () => {
    const normalized = normalizeCoffeeBeanForFieldConfig(
      buildBean({
        blendComponents: [
          {
            country: 'Эфиопия',
            estate: 'Бона',
            processingStation: 'Вока',
            process: 'Мытая',
          },
        ],
      }),
      settingsWithEnabledFields([
        'country',
        'estate',
        'processingStation',
        'process',
      ])
    );

    expect(normalized.blendComponents).toEqual([
      {
        country: 'Эфиопия',
        estate: 'Бона',
        processingStation: 'Вока',
        process: 'Мытая',
      },
    ]);
    expect(normalized.notes).toBeUndefined();
  });

  it('promotes explicitly labeled notes into enabled component fields', () => {
    const normalized = normalizeCoffeeBeanForFieldConfig(
      buildBean({
        blendComponents: [{ country: 'Колумбия', process: 'Хани' }],
        notes:
          'Страна: Колумбия / Регион: NARIÑO / Высота: 2200–2300 M.A.S.L / Обработка: Хани',
      }),
      settingsWithEnabledFields(['country', 'region', 'altitude', 'process'])
    );

    expect(normalized.blendComponents).toEqual([
      {
        country: 'Колумбия',
        region: 'NARIÑO',
        altitude: '2200-2300m',
        process: 'Хани',
      },
    ]);
    expect(normalized.notes).toBeUndefined();
  });

  it('uses component prefixes without guessing unprefixed multi-component notes', () => {
    const normalized = normalizeCoffeeBeanForFieldConfig(
      buildBean({
        blendComponents: [{ process: 'Мытая' }, { process: 'Натуральная' }],
        notes: 'Компонент 1 Регион: Сидамо / Регион: Гуджи',
      }),
      settingsWithEnabledFields(['region', 'process'])
    );

    expect(normalized.blendComponents).toEqual([
      { region: 'Сидамо', process: 'Мытая' },
      { process: 'Натуральная' },
    ]);
    expect(normalized.notes).toBe('Регион: Гуджи');
  });

  it('uses structured origin fields before legacy origin for display', () => {
    expect(
      getComponentOriginDisplay({
        origin: 'Эфиопия Сидамо Бона',
        country: 'Эфиопия',
        region: 'Сидамо',
        estate: 'Бона',
        processingStation: 'Вока',
      })
    ).toBe('Эфиопия · Сидамо · Бона · Вока');
  });

  it('falls back to legacy origin when no structured origin fields exist', () => {
    expect(getComponentOriginDisplay({ origin: 'Эфиопия Сидамо' })).toBe(
      'Эфиопия Сидамо'
    );
  });
});

describe('getComponentFieldValue', () => {
  it('stringifies non-string process values without throwing', () => {
    expect(
      getComponentFieldValue(
        { process: ['Мытая', 'Натуральная'] as unknown as string },
        'process'
      )
    ).toBe('Мытая / Натуральная');
    expect(
      getComponentFieldValue({ process: 123 as unknown as string }, 'process')
    ).toBe('123');
    expect(
      getComponentFieldValue(
        { process: { name: 'Мытая' } as unknown as string },
        'process'
      )
    ).toBe('');
  });
});
