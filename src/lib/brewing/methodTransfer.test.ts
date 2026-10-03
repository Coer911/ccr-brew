import { describe, expect, it } from 'vitest';
import type { CustomEquipment, Method } from '@/lib/core/config';
import { canTransferMethod, transferMethodToEquipment } from './methodTransfer';

const v60: CustomEquipment = {
  id: 'V60',
  name: 'V60',
  animationType: 'v60',
  isCustom: true,
};

const clever: CustomEquipment = {
  id: 'CleverDripper',
  name: 'Clever',
  animationType: 'clever',
  isCustom: true,
  hasValve: true,
};

const espresso: CustomEquipment = {
  id: 'Espresso',
  name: 'Эспрессо-машина',
  animationType: 'espresso',
  isCustom: true,
};

const makeCustomEquipment = (
  id: string,
  animations: NonNullable<CustomEquipment['customPourAnimations']>
): CustomEquipment => ({
  id,
  name: id,
  animationType: 'custom',
  isCustom: true,
  customPourAnimations: animations,
});

const makeMethod = (stages: Method['params']['stages']): Method => ({
  id: 'method-1',
  name: 'Тестовый рецепт',
  params: {
    coffee: '15g',
    water: '225g',
    ratio: '1:15',
    grindSize: 'Средне-мелкий',
    temp: '92°C',
    stages,
  },
});

describe('canTransferMethod', () => {
  it('rejects espresso methods on pour-over equipment', () => {
    const method = makeMethod([
      { pourType: 'extraction', label: 'Экстракция', duration: 25, detail: '' },
    ]);

    expect(canTransferMethod(method, espresso, v60)).toBe(false);
  });

  it('allows pour-over methods between pour-over equipment', () => {
    const method = makeMethod([
      {
        pourType: 'circle',
        label: 'Пролив по кругу',
        water: '30',
        duration: 10,
        detail: '',
      },
    ]);

    expect(canTransferMethod(method, v60, clever)).toBe(true);
  });
});

describe('transferMethodToEquipment', () => {
  it('keeps pour types the target equipment supports and drops the source id', () => {
    const method = makeMethod([
      {
        pourType: 'circle',
        label: 'Пролив по кругу',
        water: '30',
        duration: 10,
        detail: '',
      },
      { pourType: 'wait', label: 'Ожидание', duration: 15, detail: '' },
    ]);

    const transferred = transferMethodToEquipment(method, v60, clever);

    expect(transferred.id).toBeUndefined();
    expect(transferred.params.stages.map(stage => stage.pourType)).toEqual([
      'circle',
      'wait',
    ]);
  });

  it('maps custom pour animations to the target animation with the same name', () => {
    const source = makeCustomEquipment('custom-a', [
      { id: 'pour-1', name: 'Спиральный пролив', customAnimationSvg: '' },
    ]);
    const target = makeCustomEquipment('custom-b', [
      { id: 'pour-2', name: 'Пролив через рассекатель', customAnimationSvg: '' },
      { id: 'pour-3', name: 'Спиральный пролив', customAnimationSvg: '' },
    ]);
    const method = makeMethod([
      {
        pourType: 'pour-1',
        label: 'Спиральный пролив',
        water: '30',
        duration: 10,
        detail: '',
      },
    ]);

    const transferred = transferMethodToEquipment(method, source, target);

    expect(transferred.params.stages[0].pourType).toBe('pour-3');
  });

  it('falls back to the target default pour type when nothing matches', () => {
    const source = makeCustomEquipment('custom-a', [
      { id: 'pour-1', name: 'Спиральный пролив', customAnimationSvg: '' },
    ]);
    const target = makeCustomEquipment('custom-b', [
      { id: 'pour-2', name: 'Пролив через рассекатель', customAnimationSvg: '' },
    ]);
    const method = makeMethod([
      {
        pourType: 'pour-1',
        label: 'Спиральный пролив',
        water: '30',
        duration: 10,
        detail: '',
      },
    ]);

    const transferred = transferMethodToEquipment(method, source, target);

    expect(transferred.params.stages[0].pourType).toBe('pour-2');
  });

  it('removes valve status when the target equipment has no valve', () => {
    const method = makeMethod([
      {
        pourType: 'circle',
        label: 'Пролив по кругу',
        water: '30',
        duration: 10,
        detail: '',
        valveStatus: 'closed',
      },
    ]);

    const transferred = transferMethodToEquipment(method, clever, v60);

    expect(transferred.params.stages[0].valveStatus).toBeUndefined();
  });
});
