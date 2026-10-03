// 视图模式定义 - 独立常量文件，避免循环依赖
export const VIEW_OPTIONS = {
  INVENTORY: 'inventory',
  RANKING: 'ranking',
  STATS: 'stats',
} as const;

export type ViewOption = (typeof VIEW_OPTIONS)[keyof typeof VIEW_OPTIONS];

// 视图选项的显示名称
export const VIEW_LABELS: Record<ViewOption, string> = {
  [VIEW_OPTIONS.INVENTORY]: 'Запасы зерна',
  [VIEW_OPTIONS.RANKING]: 'Мой рейтинг',
  [VIEW_OPTIONS.STATS]: 'Статистика',
};

// 简化版视图选项显示名称
export const SIMPLIFIED_VIEW_LABELS: Record<ViewOption, string> = {
  [VIEW_OPTIONS.INVENTORY]: 'Запасы',
  [VIEW_OPTIONS.RANKING]: 'Рейтинг',
  [VIEW_OPTIONS.STATS]: 'Статистика',
};
