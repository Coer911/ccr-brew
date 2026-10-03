import { describe, expect, it } from 'vitest';
import {
  buildSettingsSearchItems,
  getBeanSettingsSearchRevealState,
  makeSettingRowSearchId,
  shouldRevealGreenBeanSearchSettings,
} from './settingsSearch';
import { defaultSettings } from '@/lib/stores/settingsStore';

describe('settings search reveal state', () => {
  it('reveals conditional bean settings for the selected result', () => {
    expect(
      getBeanSettingsSearchRevealState(makeSettingRowSearchId('Общая цена'))
    ).toMatchObject({ priceDetails: true, beanFields: false });
    expect(
      getBeanSettingsSearchRevealState(makeSettingRowSearchId('Текст заметки'))
    ).toMatchObject({ noteDetails: true });
  });

  it('opens the bean field drawer for nested field results', () => {
    expect(
      getBeanSettingsSearchRevealState(makeSettingRowSearchId('Обжарщик'))
    ).toMatchObject({ beanFields: true });
    expect(
      getBeanSettingsSearchRevealState(makeSettingRowSearchId('Разделитель обжарщика'))
    ).toMatchObject({ beanFields: true });
    expect(
      getBeanSettingsSearchRevealState(makeSettingRowSearchId('Страна'))
    ).toMatchObject({ beanFields: true });
    expect(
      getBeanSettingsSearchRevealState(makeSettingRowSearchId('Поля зерна'))
    ).toMatchObject({ beanFields: false });
  });

  it('routes immersive form search results to coffee bean settings', () => {
    const immersiveFormSettingId = makeSettingRowSearchId('Форма на весь экран');
    const items = buildSettingsSearchItems({
      settings: defaultSettings,
      visibleModules: { brewing: true, coffeeBean: true, notes: true },
      hasVisibleNotificationSettings: true,
      beans: [],
      customEquipments: [],
      customMethodsByEquipment: {},
      grinders: [],
    });

    expect(
      items.filter(item => item.settingId === immersiveFormSettingId)
    ).toEqual([
      expect.objectContaining({
        pageId: 'bean-settings',
        label: 'Форма на весь экран',
      }),
    ]);
  });

  it('reveals disabled green-bean sections only for their nested results', () => {
    expect(
      shouldRevealGreenBeanSearchSettings(
        makeSettingRowSearchId('Быстрые веса обжарки')
      )
    ).toBe(true);
    expect(
      shouldRevealGreenBeanSearchSettings(makeSettingRowSearchId('Включить учёт зелёного зерна'))
    ).toBe(false);
  });
});
