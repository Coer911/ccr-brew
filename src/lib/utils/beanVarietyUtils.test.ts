import { describe, expect, it } from 'vitest';
import type { CoffeeBean } from '@/types/app';
import {
  extractUniqueAltitudes,
  extractUniqueBatches,
  extractUniqueCountries,
  extractUniqueOriginSummaries,
  extractUniqueRegions,
  getBeanAltitudes,
  getBeanBatches,
  getBeanCountries,
  getBeanOriginSummaries,
  getBeanRegions,
} from './beanVarietyUtils';

const buildBean = (bean: Partial<CoffeeBean>): CoffeeBean => ({
  id: 'bean',
  timestamp: 1,
  name: 'Test Bean',
  capacity: '100',
  remaining: '100',
  beanState: 'roasted',
  ...bean,
});

describe('beanVarietyUtils structured bean fields', () => {
  it('keeps legacy origin separate from structured origin fields for stats', () => {
    const bean = buildBean({
      blendComponents: [
        {
          origin: 'Эфиопия Сидамо',
          country: 'Эфиопия',
          region: 'Сидамо',
          altitude: '2100m',
          batch: 'A12',
        },
      ],
    });

    expect(getBeanOriginSummaries(bean)).toEqual(['Эфиопия Сидамо']);
    expect(getBeanCountries(bean)).toEqual(['Эфиопия']);
    expect(getBeanRegions(bean)).toEqual(['Сидамо']);
    expect(getBeanAltitudes(bean)).toEqual(['2100m']);
    expect(getBeanBatches(bean)).toEqual(['A12']);
    expect(extractUniqueOriginSummaries([bean])).toEqual(['Эфиопия Сидамо']);
    expect(extractUniqueCountries([bean])).toEqual(['Эфиопия']);
    expect(extractUniqueRegions([bean])).toEqual(['Сидамо']);
    expect(extractUniqueAltitudes([bean])).toEqual(['2100m']);
    expect(extractUniqueBatches([bean])).toEqual(['A12']);
  });
});
