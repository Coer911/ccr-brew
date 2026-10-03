import type { CustomEquipment, Method } from '@/lib/core/config';
import { commonMethods, equipmentList } from '@/lib/core/config';
import type { SettingsOptions } from '@/lib/core/db';
import type { Grinder } from '@/lib/stores/grinderStore';
import type { LucideIcon } from 'lucide-react';
import { pinyin } from 'pinyin-pro';
import {
  CONFIGURABLE_COFFEE_BEAN_VIEW_ORDER,
  getMainNavigationTabLabel,
  MAIN_NAVIGATION_TABS,
  type MainNavigationTab,
} from '@/lib/navigation/navigationSettings';
import {
  SIMPLIFIED_VIEW_LABELS,
  VIEW_LABELS,
} from '@/components/coffee-bean/List/constants';
import type { CoffeeBean } from '@/types/app';
import { extractUniqueRoasters } from '@/lib/utils/beanVarietyUtils';
import { normalizeCoffeeBeanGroups } from '@/lib/utils/coffeeBeanGroupUtils';
import { BEAN_FIELD_DEFINITIONS } from '@/lib/coffee-beans/beanFields';

export type SettingsSearchPageId =
  | 'settings'
  | 'display-settings'
  | 'navigation-settings'
  | 'stock-settings'
  | 'bean-settings'
  | 'green-bean-settings'
  | 'coffee-bean-group-settings'
  | 'flavor-period-settings'
  | 'brewing-settings'
  | 'timer-settings'
  | 'data-settings'
  | 'notification-settings'
  | 'random-coffee-bean-settings'
  | 'equipment-method-settings'
  | 'note-settings'
  | 'flavor-dimension-settings'
  | 'roaster-logo-settings'
  | 'grinder-settings'
  | 'experimental-settings'
  | 'about-settings';

export interface SettingsSearchTarget {
  pageId: SettingsSearchPageId;
  settingId: string;
}

export interface SettingsSearchItem extends SettingsSearchTarget {
  id: string;
  label: string;
  icon?: LucideIcon;
  value?: string;
  description?: string;
  groupLabel?: string;
  entryPath?: string[];
  keywords?: string[];
}

export interface SettingsSearchEntryMetadata {
  label: string;
  icon?: LucideIcon;
}

export type SettingsSearchEntryMetadataMap = Partial<
  Record<SettingsSearchPageId, SettingsSearchEntryMetadata>
>;

interface BuildSettingsSearchItemsOptions {
  settings: SettingsOptions;
  visibleModules: Record<MainNavigationTab, boolean>;
  hasVisibleNotificationSettings: boolean;
  beans: CoffeeBean[];
  customEquipments: CustomEquipment[];
  customMethodsByEquipment: Record<string, Method[]>;
  grinders: Grinder[];
}

type SearchItemInput = Omit<SettingsSearchItem, 'id' | 'settingId'> & {
  settingId?: string;
};

export const makeSettingsSearchId = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKC')
    .trim()
    .replace(/[\s/]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

export const makeSettingRowSearchId = (label: string) =>
  `row-${makeSettingsSearchId(label)}`;

export const makeDynamicSettingSearchId = (prefix: string, value: string) =>
  `${prefix}-${makeSettingsSearchId(value)}`;

const makeSettingSearchIdSet = (labels: string[]) =>
  new Set(labels.map(makeSettingRowSearchId));

const BEAN_NOTE_DETAIL_SEARCH_IDS = makeSettingSearchIdSet([
  'Вкусы',
  'Текст заметки',
  'Строк заметки',
]);
const BEAN_FIELD_SEARCH_IDS = makeSettingSearchIdSet([
  'Обжарщик',
  'Разделитель обжарщика',
  ...BEAN_FIELD_DEFINITIONS.map(definition =>
    definition.id === 'origin' ? 'Происхождение' : definition.label
  ),
]);
const GREEN_BEAN_DETAIL_SEARCH_IDS = makeSettingSearchIdSet([
  'Включить «Обжарить всё»',
  'Разрешить свой вес обжарки',
  'Быстрые веса обжарки',
  'Обжаренное → зелёное',
]);

export interface BeanSettingsSearchRevealState {
  priceDetails: boolean;
  noteDetails: boolean;
  ratingDetails: boolean;
  beanFields: boolean;
}

export const getBeanSettingsSearchRevealState = (
  highlightedSettingId: string | null
): BeanSettingsSearchRevealState => ({
  priceDetails: highlightedSettingId === makeSettingRowSearchId('Общая цена'),
  noteDetails: Boolean(
    highlightedSettingId &&
    BEAN_NOTE_DETAIL_SEARCH_IDS.has(highlightedSettingId)
  ),
  ratingDetails: highlightedSettingId === makeSettingRowSearchId('Десятибалльная шкала'),
  beanFields: Boolean(
    highlightedSettingId && BEAN_FIELD_SEARCH_IDS.has(highlightedSettingId)
  ),
});

export const shouldRevealGreenBeanSearchSettings = (
  highlightedSettingId: string | null
): boolean =>
  Boolean(
    highlightedSettingId &&
    GREEN_BEAN_DETAIL_SEARCH_IDS.has(highlightedSettingId)
  );

export const normalizeSettingsSearchText = (value: string) =>
  value.toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();

const getPinyinText = (value: string) => {
  if (!value) return '';

  const full = pinyin(value, { toneType: 'none' });
  const initials = pinyin(value, { pattern: 'first', toneType: 'none' });

  return [
    full,
    full.replace(/\s+/g, ''),
    initials,
    initials.replace(/\s+/g, ''),
  ].join(' ');
};

const buildSettingsSearchText = (item: SettingsSearchItem) =>
  normalizeSettingsSearchText(
    [
      item.label,
      item.value,
      item.description,
      item.groupLabel,
      ...(item.entryPath || []),
      ...(item.keywords || []),
      getPinyinText(item.label),
      item.groupLabel ? getPinyinText(item.groupLabel) : '',
      ...(item.entryPath || []).map(getPinyinText),
      ...(item.keywords || []).map(getPinyinText),
    ]
      .filter(Boolean)
      .join(' ')
  );

export const filterSettingsSearchItems = (
  items: SettingsSearchItem[],
  query: string
) => {
  const tokens = normalizeSettingsSearchText(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  return items.filter(item => {
    const searchText = buildSettingsSearchText(item);
    return tokens.every(token => searchText.includes(token));
  });
};

const buildEntryPath = (
  entryLabel: string | undefined,
  groupLabel: string | undefined
) => {
  if (!entryLabel) return groupLabel ? [groupLabel] : undefined;
  if (!groupLabel || entryLabel === groupLabel) return [entryLabel];
  if (entryLabel.includes(groupLabel) || groupLabel.includes(entryLabel)) {
    return [entryLabel];
  }
  return [entryLabel, groupLabel];
};

export const applySettingsSearchEntryMetadata = (
  items: SettingsSearchItem[],
  metadata: SettingsSearchEntryMetadataMap
) =>
  items.map(item => {
    const entry = metadata[item.pageId];
    return {
      ...item,
      icon: item.icon ?? entry?.icon,
      entryPath:
        item.entryPath ?? buildEntryPath(entry?.label, item.groupLabel),
    };
  });

const createItem = ({
  pageId,
  settingId,
  label,
  icon,
  value,
  description,
  groupLabel,
  entryPath,
  keywords,
}: SearchItemInput): SettingsSearchItem => {
  const resolvedSettingId = settingId ?? makeSettingRowSearchId(label);
  return {
    id: `${pageId}:${resolvedSettingId}`,
    pageId,
    settingId: resolvedSettingId,
    label,
    icon,
    value,
    description,
    groupLabel,
    entryPath,
    keywords,
  };
};

const createRowItems = (
  pageId: SettingsSearchPageId,
  pageLabel: string,
  labels: Array<
    string | { label: string; description?: string; value?: string }
  >
) =>
  labels.map(item => {
    const data = typeof item === 'string' ? { label: item } : item;
    return createItem({
      pageId,
      groupLabel: pageLabel,
      ...data,
    });
  });

const isModuleVisible = (
  visibleModules: Record<MainNavigationTab, boolean>,
  module: MainNavigationTab
) => visibleModules[module];

const getMethodId = (method: Method) => method.id || method.name;

export const buildSettingsSearchItems = ({
  settings,
  visibleModules,
  hasVisibleNotificationSettings,
  beans,
  customEquipments,
  customMethodsByEquipment,
  grinders,
}: BuildSettingsSearchItemsOptions): SettingsSearchItem[] => {
  const items: SettingsSearchItem[] = [
    ...createRowItems('display-settings', 'Внешний вид', [
      'Тема',
      'Шрифт',
      'Показывать иконки в меню',
      'Отступ сверху',
      'Отступ снизу',
    ]),
    ...createRowItems('data-settings', 'Данные и копии', [
      'Сервис синхронизации',
      'Сервис копий',
      'Постоянное хранилище',
      'Напоминание о копии',
      'Как часто',
      'Потяните, чтобы загрузить',
      'Пошаговая настройка',
      'Управление данными',
      'Импорт данных',
      'Выгрузить данные',
      'Сброс данных',
      'Сжать фото',
    ]),
    ...createRowItems('about-settings', 'О приложении', [
      'Политика конфиденциальности',
      'Благодарности открытому ПО',
      'Ссылки',
    ]),
  ];

  if (hasVisibleNotificationSettings) {
    items.push(
      ...createRowItems('notification-settings', 'Уведомления', [
        'Звук',
        'Вибрация',
        'Сообщать об обновлениях',
        'Всплывающие напоминания',
        'Синхронизация с календарём',
      ])
    );
  }

  items.push(
    ...createRowItems('navigation-settings', 'Функции приложения', [
      'Короткие подписи',
      'Включённые функции',
      'Виды',
      'Закреплённые виды',
    ])
  );

  MAIN_NAVIGATION_TABS.forEach(tab => {
    items.push(
      createItem({
        pageId: 'navigation-settings',
        settingId: makeDynamicSettingSearchId('navigation-tab', tab),
        label: getMainNavigationTabLabel(tab, settings.simplifiedViewLabels),
        groupLabel: 'Включённые функции',
        keywords: [
          getMainNavigationTabLabel(tab, false),
          getMainNavigationTabLabel(tab, true),
          'Функции приложения',
        ],
      })
    );
  });

  if (visibleModules.coffeeBean) {
    CONFIGURABLE_COFFEE_BEAN_VIEW_ORDER.forEach(view => {
      const label = settings.simplifiedViewLabels
        ? SIMPLIFIED_VIEW_LABELS[view]
        : VIEW_LABELS[view];
      const keywords = [
        VIEW_LABELS[view],
        SIMPLIFIED_VIEW_LABELS[view],
        'Вид',
      ];

      items.push(
        createItem({
          pageId: 'navigation-settings',
          settingId: makeDynamicSettingSearchId(
            'navigation-view-display',
            view
          ),
          label,
          groupLabel: 'Виды',
          keywords,
        }),
        createItem({
          pageId: 'navigation-settings',
          settingId: makeDynamicSettingSearchId('navigation-view-pin', view),
          label,
          groupLabel: 'Закреплённые виды',
          keywords: [...keywords, 'Закрепить'],
        })
      );
    });
  }

  if (isModuleVisible(visibleModules, 'brewing')) {
    items.push(
      ...createRowItems('brewing-settings', 'Заварка', ['Шаг выбора зерна']),
      ...createRowItems('timer-settings', 'Таймер', [
        'Показывать скорость пролива',
        'Визуализация заварки',
        'Высота шкалы прогресса',
        'Размер шрифта данных',
        'Время этапа',
      ])
    );
  }

  if (isModuleVisible(visibleModules, 'coffeeBean')) {
    items.push(
      ...createRowItems('bean-settings', 'Зерно', [
        'Формат даты',
        'Цена',
        'Общая цена',
        'Точка состояния',
        'Заметка',
        'Вкусы',
        'Текст заметки',
        'Строк заметки',
        'Печать этикеток',
        'Оценка',
        'Десятибалльная шкала',
        'Форма на весь экран',
        'Автозаполнение фото',
        'Обжарщик',
        'Разделитель обжарщика',
        'Поля зерна',
        'Происхождение',
        'Страна',
        'Регион',
        'Ферма',
        'Станция обработки',
        'Высота',
        'Обработка',
        'Партия',
        'Разновидность',
      ]),
      ...createRowItems('stock-settings', 'Списание запасов', [
        'Включить «Списать всё»',
        'Разрешить свой вес списания',
        'Быстрые веса списания',
      ]),
      ...createRowItems('green-bean-settings', 'Зелёное зерно', [
        'Включить учёт зелёного зерна',
        'Включить «Обжарить всё»',
        'Разрешить свой вес обжарки',
        'Быстрые веса обжарки',
        'Обжаренное → зелёное',
      ]),
      ...createRowItems('flavor-period-settings', 'Лучший период', [
        'Светлая',
        'Средняя',
        'Тёмная',
      ]),
      ...createRowItems('random-coffee-bean-settings', 'Случайное зерно', [
        'Долгое нажатие — случайное зерно другого типа',
        'Тип при долгом нажатии',
        'Отдых',
        'Лучший период',
        'Угасание',
        'Заморожено',
        'В пути',
        'Неизвестное состояние',
      ])
    );

    normalizeCoffeeBeanGroups(settings.coffeeBeanGroups, beans).forEach(
      group => {
        items.push(
          createItem({
            pageId: 'coffee-bean-group-settings',
            settingId: makeDynamicSettingSearchId('group', group.id),
            label: group.name,
            value: `${group.beanIds.length} шт. зерна`,
            groupLabel: 'Группы',
            keywords: ['Группы зерна', 'Группы'],
          })
        );
      }
    );

    const roasterNames = new Set([
      ...extractUniqueRoasters(beans, {
        roasterFieldEnabled: settings.roasterFieldEnabled,
        roasterSeparator: settings.roasterSeparator,
      }),
      ...(settings.roasterConfigs || []).map(config => config.roasterName),
    ]);
    const sortedRoasterNames = Array.from(roasterNames)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'zh-CN'));

    if (sortedRoasterNames.length > 0) {
      items.push(
        createItem({
          pageId: 'flavor-period-settings',
          label: 'Настройки для обжарщиков',
          groupLabel: 'Лучший период',
          keywords: ['Обжарщик', 'Лучший период', 'Шаблон'],
        })
      );
    }

    sortedRoasterNames.forEach(roaster => {
      const hasLogo = Boolean(
        settings.roasterConfigs?.find(config => config.roasterName === roaster)
          ?.logoData
      );
      items.push(
        createItem({
          pageId: 'roaster-logo-settings',
          settingId: makeDynamicSettingSearchId('roaster', roaster),
          label: roaster,
          value: hasLogo ? 'Логотип задан' : undefined,
          groupLabel: 'Логотип обжарщика',
          keywords: ['Обжарщик', 'Логотип', 'logo', 'roaster'],
        })
      );
    });
  }

  if (isModuleVisible(visibleModules, 'notes')) {
    items.push(
      ...createRowItems('note-settings', 'Заметки', [
        'Классический список',
        'Вход в критерии оценки',
        'Цена',
        'Отдых',
        'Вкусы',
        'Время',
        'Оценка',
        'Оценивать ползунком',
        'Оценка вкуса',
        'Шаг 0,5',
        'Десятибалльная шкала',
        'Начальное значение = общая оценка',
        'Записи об изменении остатка',
      ])
    );

    (settings.flavorDimensions || []).forEach(dimension => {
      items.push(
        createItem({
          pageId: 'flavor-dimension-settings',
          settingId: makeDynamicSettingSearchId('dimension', dimension.id),
          label: dimension.label,
          value: dimension.isDefault ? 'Стандартные критерии' : 'Свои критерии',
          groupLabel: 'Критерии оценки',
          keywords: ['Оценка вкуса', 'Критерии оценки'],
        })
      );
    });
  }

  if (
    isModuleVisible(visibleModules, 'brewing') ||
    isModuleVisible(visibleModules, 'notes')
  ) {
    items.push(
      ...createRowItems('grinder-settings', 'Кофемолки', [
        'Добавить кофемолку',
      ]),
      ...createRowItems('equipment-method-settings', 'Устройства и рецепты', ['Добавить устройство'])
    );

    grinders.forEach(grinder => {
      items.push(
        createItem({
          pageId: 'grinder-settings',
          settingId: makeDynamicSettingSearchId('grinder', grinder.id),
          label: grinder.name,
          value: grinder.currentGrindSize,
          groupLabel: 'Кофемолки',
          keywords: ['Кофемолки', 'Помол', 'Шкала'],
        })
      );
    });

    const customEquipmentIds = new Set(
      customEquipments.map(equipment => equipment.id)
    );
    equipmentList.forEach(equipment => {
      items.push(
        createItem({
          pageId: 'equipment-method-settings',
          settingId: makeDynamicSettingSearchId('equipment', equipment.id),
          label:
            settings.equipmentNameOverrides?.[equipment.id]?.trim() ||
            equipment.name,
          value: settings.hiddenEquipments?.includes(equipment.id)
            ? 'Скрыто'
            : undefined,
          groupLabel: 'Стандартные устройства',
          keywords: ['Устройства', 'Рецепт'],
        })
      );
    });
    customEquipments.forEach(equipment => {
      items.push(
        createItem({
          pageId: 'equipment-method-settings',
          settingId: makeDynamicSettingSearchId('equipment', equipment.id),
          label: equipment.name,
          groupLabel: 'Своё устройство',
          keywords: ['Устройства', 'Рецепт'],
        })
      );
    });

    Object.entries(customMethodsByEquipment).forEach(
      ([equipmentId, methods]) => {
        methods.forEach(method => {
          const equipmentName =
            customEquipments.find(equipment => equipment.id === equipmentId)
              ?.name ||
            equipmentList.find(equipment => equipment.id === equipmentId)
              ?.name ||
            equipmentId;
          items.push(
            createItem({
              pageId: 'equipment-method-settings',
              settingId: makeDynamicSettingSearchId(
                'method',
                `${equipmentId}-${getMethodId(method)}`
              ),
              label: method.name,
              value: equipmentName,
              groupLabel: 'Свой рецепт',
              keywords: ['Рецепты заварки', 'Рецепт', equipmentName],
            })
          );
        });
      }
    );

    Object.entries(commonMethods).forEach(([equipmentId, methods]) => {
      if (customEquipmentIds.has(equipmentId)) return;

      methods.forEach(method => {
        const methodId = getMethodId(method);
        const equipmentName =
          settings.equipmentNameOverrides?.[equipmentId]?.trim() ||
          equipmentList.find(equipment => equipment.id === equipmentId)?.name ||
          equipmentId;
        items.push(
          createItem({
            pageId: 'equipment-method-settings',
            settingId: makeDynamicSettingSearchId(
              'method',
              `${equipmentId}-${methodId}`
            ),
            label: method.name,
            value: equipmentName,
            groupLabel: 'Готовые рецепты',
            keywords: ['Рецепты заварки', 'Рецепт', equipmentName],
          })
        );
      });
    });
  }

  if (isModuleVisible(visibleModules, 'coffeeBean')) {
    items.push(
      ...createRowItems('experimental-settings', 'Экспериментальные функции', [
        'Глобальный поиск в настройках',
        'Максимум для показа',
        'Импорт архивов через «Поделиться»',
        'Свой API распознавания зерна',
      ])
    );
  } else {
    items.push(
      ...createRowItems('experimental-settings', 'Экспериментальные функции', ['Глобальный поиск в настройках'])
    );
  }

  if (isModuleVisible(visibleModules, 'coffeeBean')) {
    if (settings.enableBeanSummaryCapacityLimit) {
      items.push(
        ...createRowItems('experimental-settings', 'Экспериментальные функции', [
          'Циклический показ сверх лимита',
          'Лимит показа',
        ])
      );
    }

    if (settings.experimentalBeanRecognitionEnabled) {
      items.push(
        ...createRowItems('experimental-settings', 'Свой API распознавания зерна', [
          'API URL',
          'API Key',
          'Model',
          'System Prompt',
          'Проверить подключение',
        ])
      );
    }
  }

  if (isModuleVisible(visibleModules, 'notes')) {
    items.push(
      ...createRowItems('experimental-settings', 'Экспериментальные функции', [
        'Синхронизировать дату фильтра',
        'Быстрое списание',
      ])
    );
  }

  return items;
};
