import { CoffeeBean } from '@/types/app';
import { calculateFlavorInfo } from './flavorPeriodUtils';

/**
 * 获取咖啡豆的赏味期信息
 */
export const getFlavorInfo = (
  bean: CoffeeBean
): { phase: string; remainingDays: number } => {
  // 处理在途状态
  if (bean.isInTransit) {
    return { phase: 'В пути', remainingDays: 0 };
  }

  // 处理冷冻状态
  if (bean.isFrozen) {
    return { phase: 'Заморожено', remainingDays: 0 };
  }

  // 没有烘焙日期的归为"其他"类别
  if (!bean.roastDate) {
    return { phase: 'Другое', remainingDays: 0 };
  }

  // 使用统一的赏味期计算工具
  const flavorInfo = calculateFlavorInfo(bean);

  return {
    phase: flavorInfo.phase,
    remainingDays: flavorInfo.remainingDays,
  };
};

/**
 * 获取阶段数值用于排序
 * 排序规则：衰退期 > 赏味期 > 冷冻 > 养豆期 > 在途 > 其他
 */
export const getPhaseValue = (phase: string): number => {
  switch (phase) {
    case 'Угасание':
      return 0;
    case 'Лучший период':
      return 1;
    case 'Заморожено':
      return 2;
    case 'Отдых':
      return 3;
    case 'В пути':
      return 4;
    default:
      return 5; // 其他未知状态
  }
};

/**
 * 计算咖啡豆已养豆天数（从烘焙日期到现在）
 */
export const getDaysFromRoast = (bean: CoffeeBean): number => {
  if (!bean.roastDate) return 0;
  const roastDate = new Date(bean.roastDate);
  const today = new Date();
  const diffTime = today.getTime() - roastDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 统一的咖啡豆赏味期比较函数。
 *
 * 阶段顺序始终保持一致；desc 只反转同一阶段内的天数/日期顺序。
 * 排序规则（从上到下）：
 * - 衰退期 → 越老越靠前
 * - 赏味期 → 快过期的优先
 * - 冷冻 → 越老越靠前
 * - 养豆期 → 快熟成的优先
 * - 在途 → 按日期排序
 * - 其他 → 无日期豆子，排最后
 */
export const compareBeansByFlavorPeriod = (
  a: CoffeeBean,
  b: CoffeeBean,
  desc = false
): number => {
  const { phase: phaseA, remainingDays: daysA } = getFlavorInfo(a);
  const { phase: phaseB, remainingDays: daysB } = getFlavorInfo(b);

  if (phaseA !== phaseB) {
    const phaseValueA = getPhaseValue(phaseA);
    const phaseValueB = getPhaseValue(phaseB);
    return phaseValueA - phaseValueB;
  }

  if (phaseA === 'Угасание') {
    const daysFromRoastA = getDaysFromRoast(a);
    const daysFromRoastB = getDaysFromRoast(b);
    const result = daysFromRoastB - daysFromRoastA;
    return desc ? -result : result;
  }

  if (phaseA === 'Лучший период') {
    const result = daysA - daysB;
    return desc ? -result : result;
  }

  if (phaseA === 'Заморожено') {
    const daysFromRoastA = getDaysFromRoast(a);
    const daysFromRoastB = getDaysFromRoast(b);
    const result = daysFromRoastB - daysFromRoastA;
    return desc ? -result : result;
  }

  if (phaseA === 'Отдых') {
    const result = daysA - daysB;
    return desc ? -result : result;
  }

  const timeA = a.roastDate ? new Date(a.roastDate).getTime() : NaN;
  const timeB = b.roastDate ? new Date(b.roastDate).getTime() : NaN;

  if (isNaN(timeA) && isNaN(timeB)) return 0;
  if (isNaN(timeA)) return 1;
  if (isNaN(timeB)) return -1;

  const result = timeB - timeA;
  return desc ? -result : result;
};

/**
 * 统一的咖啡豆排序函数
 */
export const sortBeansByFlavorPeriod = (beans: CoffeeBean[]): CoffeeBean[] => {
  return [...beans].sort((a, b) => compareBeansByFlavorPeriod(a, b));
};

/**
 * 反向的咖啡豆排序函数（用于"从多到少"排序）
 * 排序规则与 sortBeansByFlavorPeriod 完全相反
 */
export const sortBeansByFlavorPeriodReverse = (
  beans: CoffeeBean[]
): CoffeeBean[] => {
  return [...beans].sort((a, b) => compareBeansByFlavorPeriod(a, b, true));
};
