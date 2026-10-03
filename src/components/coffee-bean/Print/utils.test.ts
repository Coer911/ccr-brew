import { describe, expect, it } from 'vitest';
import { createInitialContent } from './utils';
import { getAvailablePrintFieldOrder } from './fields';
import type { EditableContent } from './types';
import type { CoffeeBean } from '@/types/app';
import type { AppSettings } from '@/lib/core/db';

describe('bean print content', () => {
  it('extracts structured origin fields independently', () => {
    const bean: CoffeeBean = {
      id: 'bean',
      timestamp: 1,
      name: 'Чирака',
      blendComponents: [
        {
          origin: 'Эфиопия Сидамо Бона',
          country: 'Эфиопия',
          region: 'Сидамо',
          estate: 'Бона',
          processingStation: 'Вока',
          process: 'Мытая',
        },
      ],
    };

    const content = createInitialContent(bean, {});

    expect(content.origin).toBe('Эфиопия Сидамо Бона');
    expect(content.country).toBe('Эфиопия');
    expect(content.region).toBe('Сидамо');
    expect(content.estate).toBe('Бона');
    expect(content.processingStation).toBe('Вока');
  });

  it('shows configured component fields and keeps fields with existing bean data', () => {
    const content: EditableContent = {
      name: 'Чирака',
      roaster: '',
      origin: '',
      country: 'Эфиопия',
      region: 'Сидамо',
      estate: '',
      processingStation: '',
      altitude: '',
      roastLevel: '',
      roastDate: '',
      packDate: '',
      process: 'Мытая',
      batch: '1931',
      variety: '',
      flavor: [],
      notes: '',
      weight: '',
      icon: '',
      iconSource: 'custom',
    };
    const settings: Pick<AppSettings, 'beanFieldConfig'> = {
      beanFieldConfig: {
        version: 1,
        fields: [
          { id: 'country', enabled: true, order: 0 },
          { id: 'process', enabled: true, order: 1 },
          { id: 'batch', enabled: false, order: 2 },
          { id: 'estate', enabled: false, order: 3 },
          { id: 'variety', enabled: false, order: 4 },
        ],
      },
    };

    const fields = getAvailablePrintFieldOrder('minimal', content, settings);

    expect(fields).toContain('country');
    expect(fields).toContain('process');
    expect(fields).toContain('batch');
    expect(fields).not.toContain('origin');
    expect(fields).not.toContain('estate');
    expect(fields).not.toContain('variety');
  });
});
