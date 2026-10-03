import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBeanRecognitionPrompt,
  normalizeRecognizedBeanPayload,
  recognizeBeanImage,
} from './beanRecognition';
import type { BeanFieldId } from '@/lib/coffee-beans/beanFields';

const fieldSettings = (...ids: BeanFieldId[]) => ({
  beanFieldConfig: {
    version: 1 as const,
    fields: ids.map((id, order) => ({ id, enabled: true, order })),
  },
});

describe('normalizeRecognizedBeanPayload', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('deduplicates variety-only blend components', () => {
    const payload = normalizeRecognizedBeanPayload({
      name: '2026 Деревня Гейша, Gold Label, Oma 157',
      blendComponents: [
        { origin: 'Деревня Гейша', process: 'Мытая', variety: 'Oma 157' },
        { variety: 'Oma 157 Oma 157' },
      ],
    });

    expect(payload).toEqual({
      name: '2026 Деревня Гейша, Gold Label, Oma 157',
      blendComponents: [
        { origin: 'Деревня Гейша', process: 'Мытая', variety: 'Oma 157' },
      ],
    });
  });

  it('prefers a named variety over a short batch number', () => {
    const payload = normalizeRecognizedBeanPayload({
      name: '2026 Деревня Гейша, Gold Label, Oma 157',
      blendComponents: [{ origin: 'Деревня Гейша', process: 'Мытая', variety: '1931' }],
    });

    expect(payload).toEqual({
      name: '2026 Деревня Гейша, Gold Label, Oma 157',
      blendComponents: [
        { origin: 'Деревня Гейша', process: 'Мытая', variety: 'Oma 157' },
      ],
    });
  });

  it('applies field settings after recognition normalization', () => {
    const payload = normalizeRecognizedBeanPayload(
      {
        name: 'Бона мытая',
        blendComponents: [
          {
            origin: 'Эфиопия',
            estate: 'Бона',
            processingStation: 'Вока',
            process: 'Мытая',
            altitude: '2100m',
            batch: 'A12',
          },
        ],
      },
      {
        beanFieldConfig: {
          version: 1,
          fields: [
            { id: 'origin', enabled: true, order: 0 },
            { id: 'process', enabled: true, order: 1 },
          ],
        },
      }
    );

    expect(payload).toEqual({
      name: 'Бона мытая',
      blendComponents: [{ origin: 'Эфиопия', process: 'Мытая' }],
      notes: 'Ферма: Бона / Станция обработки: Вока / Высота: 2100m / Партия: A12',
    });
  });

  it('normalizes the Obraje sample from an experimental API response', async () => {
    const modelPayload = {
      name: 'OBRAJE Колумбия ферма Обрахе',
      roaster: 'MEOW COFFEE',
      flavor: ['Флёрдоранж', 'Ананасовый мармелад', 'Спелый ананас', 'Сок красного апельсина'],
      blendComponents: [
        {
          country: 'Колумбия',
          region: 'NARIÑO',
          estate: 'Обрахе',
          process: 'Хани',
          variety: 'Гейша с зелёной верхушкой',
        },
      ],
      notes:
        'Страна: Колумбия / Регион: Narino / Ферма: Обрахе / Высота: 2200–2300 M.A.S.L / Обработка: Хани / Разновидность: Гейша с зелёной верхушкой',
    };
    class MockFileReader {
      result = 'data:image/jpeg;base64,/9j/4A==';
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(modelPayload),
                },
              },
            ],
          })
        )
    );

    const result = await recognizeBeanImage(
      new File(['image'], 'bean.jpg', { type: 'image/jpeg' }),
      undefined,
      {
        enabled: true,
        apiBaseUrl: 'https://example.com/v1',
        model: 'vision',
        prompt: 'base',
      },
      fieldSettings(
        'country',
        'region',
        'estate',
        'altitude',
        'process',
        'variety'
      )
    );

    const { notes: _notes, ...visiblePayload } = modelPayload;
    expect(result).toEqual({
      ...visiblePayload,
      blendComponents: [
        {
          ...visiblePayload.blendComponents[0],
          altitude: '2200-2300m',
        },
      ],
    });
  });

  it('adds final prompt constraints for configured bean fields', () => {
    const prompt = buildBeanRecognitionPrompt('base prompt', {
      beanFieldConfig: {
        version: 1,
        fields: [
          { id: 'country', enabled: true, order: 0 },
          { id: 'region', enabled: true, order: 1 },
          { id: 'processingStation', enabled: true, order: 2 },
          { id: 'process', enabled: true, order: 3 },
        ],
      },
    });

    expect(prompt).toContain('base prompt');
    expect(prompt).toContain(
      '只允许输出这些成分字段：country/region/processingStation/process'
    );
    expect(prompt).toContain('origin 是未结构化的“产地概括”');
    expect(prompt).toContain('processingStation 仅表示处理站/水洗站');
    expect(prompt).toContain('严禁输出未允许的 blendComponents 键');
    expect(prompt).toContain(
      'name 是包装展示标题，与结构化字段合理重叠不算重复'
    );
  });
});
