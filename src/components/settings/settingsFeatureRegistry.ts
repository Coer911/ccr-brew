import {
  Archive,
  Box,
  CalendarDays,
  FlaskConical,
  Folder,
  ImagePlus,
  LibraryBig,
  List,
  Notebook,
  Palette,
  Play,
  Settings2,
  Shuffle,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { MainNavigationTab } from '@/lib/navigation/navigationSettings';
import type { SettingsOptions } from '@/lib/core/db';
import type { SettingItemData } from './SettingItem';

type SettingsFeatureGroup =
  | 'brewing'
  | 'brewingEquipment'
  | 'coffeeBean'
  | 'notes'
  | 'experimental';

interface SettingsFeaturePlacement {
  group: SettingsFeatureGroup;
  module?: MainNavigationTab;
}

interface SettingsFeatureDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  settingId: string;
  onClick: keyof SettingsFeatureHandlers;
  requiredModules?: MainNavigationTab[];
  requiredAnyModules?: MainNavigationTab[];
  placements: SettingsFeaturePlacement[];
  getValue?: (settings: SettingsOptions) => string | undefined;
}

export interface SettingsFeatureGroupData {
  id: SettingsFeatureGroup;
  items: SettingItemData[];
}

interface SettingsFeatureHandlers {
  onOpenStockSettings: () => void;
  onOpenBeanSettings: () => void;
  onOpenGreenBeanSettings: () => void;
  onOpenCoffeeBeanGroupSettings: () => void;
  onOpenFlavorPeriodSettings: () => void;
  onOpenBrewingSettings: () => void;
  onOpenTimerSettings: () => void;
  onOpenRandomCoffeeBeanSettings: () => void;
  onOpenEquipmentMethodSettings: () => void;
  onOpenFlavorDimensionSettings: () => void;
  onOpenNoteSettings: () => void;
  onOpenRoasterLogoSettings: () => void;
  onOpenGrinderSettings: () => void;
  onOpenExperimentalSettings: () => void;
}

type VisibleModuleMap = Record<MainNavigationTab, boolean>;

const SETTINGS_FEATURE_GROUP_ORDER: SettingsFeatureGroup[] = [
  'brewing',
  'brewingEquipment',
  'coffeeBean',
  'notes',
  'experimental',
];

const SETTINGS_FEATURES: SettingsFeatureDefinition[] = [
  {
    id: 'brewing-settings',
    label: 'Заварка',
    icon: Play,
    settingId: 'brewing-settings',
    onClick: 'onOpenBrewingSettings',
    requiredModules: ['brewing'],
    placements: [{ group: 'brewing', module: 'brewing' }],
  },
  {
    id: 'timer-settings',
    label: 'Таймер',
    icon: Timer,
    settingId: 'timer-settings',
    onClick: 'onOpenTimerSettings',
    requiredModules: ['brewing'],
    placements: [{ group: 'brewing', module: 'brewing' }],
  },
  {
    id: 'grinder-settings',
    label: 'Кофемолки',
    icon: Settings2,
    settingId: 'grinder-settings',
    onClick: 'onOpenGrinderSettings',
    requiredAnyModules: ['brewing', 'notes'],
    placements: [{ group: 'brewingEquipment' }],
  },
  {
    id: 'equipment-method-settings',
    label: 'Устройства и рецепты',
    icon: LibraryBig,
    settingId: 'equipment-method-settings',
    onClick: 'onOpenEquipmentMethodSettings',
    requiredAnyModules: ['brewing', 'notes'],
    placements: [{ group: 'brewingEquipment' }],
  },
  {
    id: 'bean-settings',
    label: 'Зерно',
    icon: List,
    settingId: 'bean-settings',
    onClick: 'onOpenBeanSettings',
    requiredModules: ['coffeeBean'],
    placements: [{ group: 'coffeeBean', module: 'coffeeBean' }],
  },
  {
    id: 'coffee-bean-group-settings',
    label: 'Группы',
    icon: Folder,
    settingId: 'coffee-bean-group-settings',
    onClick: 'onOpenCoffeeBeanGroupSettings',
    requiredModules: ['coffeeBean'],
    placements: [{ group: 'coffeeBean', module: 'coffeeBean' }],
    getValue: settings =>
      settings.coffeeBeanGroups && settings.coffeeBeanGroups.length > 0
        ? `${settings.coffeeBeanGroups.length} гр.`
        : undefined,
  },
  {
    id: 'green-bean-settings',
    label: 'Зелёное зерно',
    icon: Box,
    settingId: 'green-bean-settings',
    onClick: 'onOpenGreenBeanSettings',
    requiredModules: ['coffeeBean'],
    placements: [{ group: 'coffeeBean', module: 'coffeeBean' }],
  },
  {
    id: 'stock-settings',
    label: 'Списание запасов',
    icon: Archive,
    settingId: 'stock-settings',
    onClick: 'onOpenStockSettings',
    requiredModules: ['coffeeBean'],
    placements: [{ group: 'coffeeBean', module: 'coffeeBean' }],
  },
  {
    id: 'flavor-period-settings',
    label: 'Лучший период',
    icon: CalendarDays,
    settingId: 'flavor-period-settings',
    onClick: 'onOpenFlavorPeriodSettings',
    requiredModules: ['coffeeBean'],
    placements: [{ group: 'coffeeBean', module: 'coffeeBean' }],
  },
  {
    id: 'roaster-logo-settings',
    label: 'Логотип обжарщика',
    icon: ImagePlus,
    settingId: 'roaster-logo-settings',
    onClick: 'onOpenRoasterLogoSettings',
    requiredModules: ['coffeeBean'],
    placements: [{ group: 'coffeeBean', module: 'coffeeBean' }],
  },
  {
    id: 'note-settings',
    label: 'Заметки',
    icon: Notebook,
    settingId: 'note-settings',
    onClick: 'onOpenNoteSettings',
    requiredModules: ['notes'],
    placements: [{ group: 'notes', module: 'notes' }],
  },
  {
    id: 'flavor-dimension-settings',
    label: 'Критерии оценки',
    icon: Palette,
    settingId: 'flavor-dimension-settings',
    onClick: 'onOpenFlavorDimensionSettings',
    requiredModules: ['notes'],
    placements: [{ group: 'notes', module: 'notes' }],
  },
  {
    id: 'random-coffee-bean-settings',
    label: 'Случайное зерно',
    icon: Shuffle,
    settingId: 'random-coffee-bean-settings',
    onClick: 'onOpenRandomCoffeeBeanSettings',
    requiredModules: ['coffeeBean'],
    placements: [
      { group: 'brewing', module: 'brewing' },
      { group: 'notes', module: 'notes' },
    ],
  },
  {
    id: 'experimental-settings',
    label: 'Экспериментальные функции',
    icon: FlaskConical,
    settingId: 'experimental-settings',
    onClick: 'onOpenExperimentalSettings',
    requiredAnyModules: ['coffeeBean', 'notes'],
    placements: [{ group: 'experimental' }],
  },
];

const isFeatureAvailable = (
  feature: SettingsFeatureDefinition,
  visibleModules: VisibleModuleMap
) => {
  const requiredModulesEnabled = (feature.requiredModules ?? []).every(
    module => visibleModules[module]
  );
  const requiredAnyModules = feature.requiredAnyModules ?? [];
  const anyRequiredModuleEnabled =
    requiredAnyModules.length === 0 ||
    requiredAnyModules.some(module => visibleModules[module]);

  return requiredModulesEnabled && anyRequiredModuleEnabled;
};

const resolveFeaturePlacement = (
  feature: SettingsFeatureDefinition,
  visibleModules: VisibleModuleMap
) =>
  feature.placements.find(
    placement => !placement.module || visibleModules[placement.module]
  )?.group;

export const buildSettingsFeatureGroups = ({
  settings,
  subSettingsHandlers,
  visibleModules,
}: {
  settings: SettingsOptions;
  subSettingsHandlers: SettingsFeatureHandlers;
  visibleModules: VisibleModuleMap;
}): SettingsFeatureGroupData[] => {
  const groups = new Map<SettingsFeatureGroup, SettingItemData[]>(
    SETTINGS_FEATURE_GROUP_ORDER.map(group => [group, []])
  );

  SETTINGS_FEATURES.forEach(feature => {
    if (!isFeatureAvailable(feature, visibleModules)) {
      return;
    }

    const group = resolveFeaturePlacement(feature, visibleModules);
    if (!group) {
      return;
    }

    groups.get(group)?.push({
      icon: feature.icon,
      label: feature.label,
      settingId: feature.settingId,
      value: feature.getValue?.(settings),
      onClick: subSettingsHandlers[feature.onClick],
    });
  });

  return SETTINGS_FEATURE_GROUP_ORDER.map(group => ({
    id: group,
    items: groups.get(group) ?? [],
  })).filter(group => group.items.length > 0);
};
