import { describe, expect, it } from 'vitest';
import { autofillBlendComponentsFromName } from './useBlendComponentSuggestions';

const suggestions = {
  origins: ['Эфиопия'],
  countries: ['Эфиопия'],
  regions: [],
  estates: [],
  processingStations: [],
  altitudes: [],
  processes: ['Мытая'],
  batches: [],
  varieties: ['Гейша'],
};

describe('autofillBlendComponentsFromName', () => {
  it('does not write to disabled component fields', () => {
    const result = autofillBlendComponentsFromName(
      [{}],
      'Эфиопия мытая гейша',
      suggestions,
      [],
      ['origin', 'process', 'variety']
    );

    expect(result.components[0]).toMatchObject({
      origin: 'Эфиопия',
      process: 'Мытая',
      variety: 'Гейша',
    });
    expect(result.components[0].country).toBeUndefined();
    expect(result.autofillComponents[0].country).toBe('');
  });

  it('writes to enabled component fields', () => {
    const result = autofillBlendComponentsFromName(
      [{}],
      'Эфиопия мытая гейша',
      suggestions,
      [],
      ['country', 'process', 'variety']
    );

    expect(result.components[0]).toMatchObject({
      country: 'Эфиопия',
      process: 'Мытая',
      variety: 'Гейша',
    });
  });
});
