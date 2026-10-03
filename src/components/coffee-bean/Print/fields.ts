import { EditableContent, PrintConfig, PrintFieldKey } from './types';
import {
  getEnabledBeanFieldIds,
  resolveBeanFieldConfig,
  type BeanFieldId,
} from '@/lib/coffee-beans/beanFields';
import type { AppSettings } from '@/lib/core/db';

export type PrintTextFieldKey = Exclude<
  keyof EditableContent,
  | 'roaster'
  | 'roastDate'
  | 'packDate'
  | 'flavor'
  | 'notes'
  | 'icon'
  | 'iconSource'
>;

export const PRINT_TEXT_FIELD_KEYS: PrintTextFieldKey[] = [
  'name',
  'origin',
  'country',
  'region',
  'estate',
  'processingStation',
  'altitude',
  'roastLevel',
  'process',
  'batch',
  'variety',
  'weight',
];

export const SIMPLE_PRINT_TEXT_FIELD_KEYS: Exclude<
  PrintTextFieldKey,
  'name'
>[] = [
  'origin',
  'country',
  'region',
  'estate',
  'processingStation',
  'altitude',
  'process',
  'batch',
  'variety',
  'roastLevel',
  'weight',
];

export const PRINT_COMPONENT_FIELD_KEYS: Exclude<
  PrintTextFieldKey,
  'name' | 'roastLevel' | 'weight'
>[] = [
  'origin',
  'country',
  'region',
  'estate',
  'processingStation',
  'altitude',
  'process',
  'batch',
  'variety',
];

export const isPrintTextFieldKey = (
  field: PrintFieldKey
): field is PrintTextFieldKey =>
  PRINT_TEXT_FIELD_KEYS.includes(field as PrintTextFieldKey);

export const isSimplePrintTextFieldKey = (
  field: PrintFieldKey
): field is Exclude<PrintTextFieldKey, 'name'> =>
  SIMPLE_PRINT_TEXT_FIELD_KEYS.includes(
    field as Exclude<PrintTextFieldKey, 'name'>
  );

export const PRINT_FIELD_ORDER: PrintFieldKey[] = [
  'name',
  'roastDate',
  'origin',
  'country',
  'region',
  'estate',
  'processingStation',
  'altitude',
  'process',
  'batch',
  'variety',
  'roastLevel',
  'flavor',
  'weight',
  'notes',
  'icon',
];

const DETAIL_ONLY_PRINT_FIELDS = new Set<PrintFieldKey>(['icon']);

export const isPrintFieldAvailableForTemplate = (
  field: PrintFieldKey,
  template: PrintConfig['template']
): boolean => template === 'detailed' || !DETAIL_ONLY_PRINT_FIELDS.has(field);

export const getPrintFieldOrder = (
  template: PrintConfig['template']
): PrintFieldKey[] =>
  PRINT_FIELD_ORDER.filter(field =>
    isPrintFieldAvailableForTemplate(field, template)
  );

const PRINT_BEAN_FIELD_IDS: Partial<Record<PrintFieldKey, BeanFieldId[]>> = {
  origin: ['origin'],
  country: ['country'],
  region: ['region'],
  estate: ['estate'],
  processingStation: ['processingStation'],
  altitude: ['altitude'],
  process: ['process'],
  batch: ['batch'],
  variety: ['variety'],
};

export const getAvailablePrintFieldOrder = (
  template: PrintConfig['template'],
  content: EditableContent,
  settings?: Pick<AppSettings, 'beanFieldConfig' | 'showEstateField'> | null
): PrintFieldKey[] => {
  const enabledFieldIds = new Set(
    getEnabledBeanFieldIds(resolveBeanFieldConfig(settings))
  );

  return getPrintFieldOrder(template).filter(field => {
    const beanFieldIds = PRINT_BEAN_FIELD_IDS[field];
    if (!beanFieldIds) return true;

    return (
      beanFieldIds.some(fieldId => enabledFieldIds.has(fieldId)) ||
      hasPrintFieldContent(field, content, template)
    );
  });
};

export const PRINT_FIELD_LABELS: Record<PrintFieldKey, string> = {
  name: 'Название',
  roastDate: 'Дата',
  origin: 'Происхождение',
  country: 'Страна',
  region: 'Регион',
  estate: 'Ферма',
  processingStation: 'Станция обработки',
  altitude: 'Высота',
  process: 'Обработка',
  batch: 'Партия',
  variety: 'Разновидность',
  roastLevel: 'Обжарка',
  flavor: 'Вкусы',
  weight: 'Вес, г',
  notes: 'Заметка',
  icon: 'Логотип',
};

export const PRINT_EDITOR_FIELD_LABELS: Record<PrintFieldKey, string> = {
  name: 'Название',
  roastDate: 'Дата',
  origin: 'Происхождение',
  country: 'Страна',
  region: 'Регион',
  estate: 'Ферма',
  processingStation: 'Станция обработки',
  altitude: 'Высота',
  process: 'Обработка',
  batch: 'Партия',
  variety: 'Разновидность',
  roastLevel: 'Обжарка',
  flavor: 'Вкусы',
  weight: 'Вес, г',
  notes: 'Заметка',
  icon: 'Логотип',
};

export const PRINT_TEXT_FIELD_PLACEHOLDERS: Record<PrintTextFieldKey, string> =
  {
    name: 'Например: земляника',
    origin: 'Происхождение',
    country: 'Страна',
    region: 'Регион',
    estate: 'Ферма',
    processingStation: 'Станция обработки',
    altitude: 'Высота',
    roastLevel: 'Обжарка',
    process: 'Например: мытая, натуральная',
    batch: 'Например: A12, Lot 24',
    variety: 'Например: катурра, гейша',
    weight: 'Например: 15',
  };

const hasValue = (value: string): boolean => value.trim().length > 0;

export const hasPrintFieldContent = (
  field: PrintFieldKey,
  content: EditableContent,
  template: PrintConfig['template']
): boolean => {
  switch (field) {
    case 'name': {
      const beanName = content.name.trim();
      if (template === 'minimal') {
        return beanName.length > 0;
      }
      return beanName.length > 0 || content.roaster.trim().length > 0;
    }
    case 'flavor':
      return content.flavor.some(item => item.trim().length > 0);
    case 'roastDate':
      return hasValue(content.roastDate);
    case 'notes':
      return hasValue(content.notes);
    case 'icon':
      return template === 'detailed' && hasValue(content.icon);
    default:
      if (isPrintTextFieldKey(field)) {
        return hasValue(content[field]);
      }
      return false;
  }
};

export const isPrintFieldVisible = (
  field: PrintFieldKey,
  config: PrintConfig,
  content: EditableContent
): boolean =>
  isPrintFieldAvailableForTemplate(field, config.template) &&
  config.fields[field] &&
  hasPrintFieldContent(field, content, config.template);
