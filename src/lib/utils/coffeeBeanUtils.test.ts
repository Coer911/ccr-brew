import { describe, expect, it } from 'vitest';
import { prepareCoffeeBeanRoasterFieldsForFormDraft } from './coffeeBeanUtils';

describe('prepareCoffeeBeanRoasterFieldsForFormDraft', () => {
  it('Название докупленного зерна, совпадающее с обжарщиком, сохраняется', () => {
    expect(
      prepareCoffeeBeanRoasterFieldsForFormDraft(
        { roaster: '111', name: '111 #2' },
        { roasterFieldEnabled: true }
      )
    ).toEqual({ roaster: '111', name: '111 #2' });
  });

  it('Повтор префикса обжарщика в старых составных названиях всё равно убирается', () => {
    expect(
      prepareCoffeeBeanRoasterFieldsForFormDraft(
        { roaster: '111', name: '111 Ethiopia' },
        { roasterFieldEnabled: true }
      )
    ).toEqual({ roaster: '111', name: 'Ethiopia' });
  });
});
