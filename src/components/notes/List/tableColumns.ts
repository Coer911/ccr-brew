export type NotesStaticTableColumnKey =
  | 'date'
  | 'bean'
  | 'agingDays'
  | 'scheme'
  | 'params'
  | 'tasteRatings'
  | 'totalRating'
  | 'notes';

export type NotesTableColumnKey = NotesStaticTableColumnKey;

export interface NotesTableColumnConfig {
  key: NotesTableColumnKey;
  label: string;
  defaultVisible: boolean;
}

export const NOTES_TABLE_STATIC_COLUMN_CONFIG: NotesTableColumnConfig[] = [
  { key: 'date', label: 'Дата', defaultVisible: false },
  { key: 'bean', label: 'Зерно', defaultVisible: true },
  { key: 'agingDays', label: 'Отдых', defaultVisible: true },
  { key: 'scheme', label: 'Рецепт', defaultVisible: true },
  { key: 'params', label: 'Параметры', defaultVisible: true },
  { key: 'tasteRatings', label: 'Критерии оценки', defaultVisible: false },
  { key: 'totalRating', label: 'Итог', defaultVisible: true },
  { key: 'notes', label: 'Заметка', defaultVisible: true },
];

export const getNotesTableColumnConfig = (): NotesTableColumnConfig[] =>
  NOTES_TABLE_STATIC_COLUMN_CONFIG;

export const getDefaultVisibleNotesTableColumns = (): NotesTableColumnKey[] =>
  getNotesTableColumnConfig()
    .filter(column => column.defaultVisible)
    .map(column => column.key);
