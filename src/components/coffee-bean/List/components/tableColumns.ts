export type TableColumnKey =
  | 'roaster'
  | 'name'
  | 'flavorPeriod'
  | 'capacity'
  | 'price'
  | 'beanType'
  | 'origin'
  | 'estate'
  | 'process'
  | 'variety'
  | 'roastLevel'
  | 'flavor'
  | 'rating'
  | 'notes';

export type DateDisplayMode = 'date' | 'flavorPeriod' | 'agingDays';

export const getDateDisplayColumnLabel = (
  dateDisplayMode: DateDisplayMode,
  hasGreenBeans: boolean
): string => {
  if (hasGreenBeans) return 'Дата покупки';

  switch (dateDisplayMode) {
    case 'flavorPeriod':
      return 'Лучший период';
    case 'agingDays':
      return 'Дней отдыха';
    case 'date':
    default:
      return 'Дата';
  }
};

export const TABLE_COLUMN_CONFIG: {
  key: TableColumnKey;
  label: string;
  greenBeanLabel?: string;
  defaultVisible: boolean;
}[] = [
  { key: 'roaster', label: 'Обжарщик', defaultVisible: false },
  { key: 'name', label: 'Название', defaultVisible: true },
  {
    key: 'flavorPeriod',
    label: 'Лучший период',
    greenBeanLabel: 'Дата покупки',
    defaultVisible: true,
  },
  { key: 'capacity', label: 'Вес', defaultVisible: true },
  { key: 'price', label: 'Цена', defaultVisible: true },
  { key: 'beanType', label: 'Тип', defaultVisible: false },
  { key: 'origin', label: 'Происхождение', defaultVisible: false },
  { key: 'estate', label: 'Ферма', defaultVisible: false },
  { key: 'process', label: 'Обработка', defaultVisible: false },
  { key: 'variety', label: 'Разновидность', defaultVisible: false },
  { key: 'roastLevel', label: 'Обжарка', defaultVisible: false },
  { key: 'flavor', label: 'Вкусы', defaultVisible: false },
  { key: 'rating', label: 'Оценка', defaultVisible: false },
  { key: 'notes', label: 'Заметка', defaultVisible: true },
];

export const getDefaultVisibleColumns = (): TableColumnKey[] =>
  TABLE_COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key);
