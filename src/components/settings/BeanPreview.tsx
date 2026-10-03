'use client';

import React from 'react';
import { ExtendedCoffeeBean } from '../coffee-bean/List/types';
import { SettingsOptions } from './Settings';
import { getBeanDisplayInitial } from '@/lib/utils/beanVarietyUtils';

interface BeanPreviewProps {
  settings: SettingsOptions;
}

// 创建示例咖啡豆数据
const createSampleBeans = (): ExtendedCoffeeBean[] => [
  {
    id: 'preview-bean-1',
    timestamp: Date.now() - 1000,
    name: 'Блю Маунтин №1, отборная партия',
    beanType: 'filter',
    price: '298',
    capacity: '225g',
    remaining: '156g',
    roastLevel: 'Светло-средняя обжарка',
    roastDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    flavor: ['Цитрусовые', 'Мёд', 'Цветочные', 'Орехи'],
    notes: 'Отборное зерно с Голубых гор Ямайки: многослойный вкус и яркая кислотность.',
    blendComponents: [
      {
        origin: 'Ямайка Блю Маунтин',
        process: 'Мытая',
        variety: 'Типика',
        percentage: 100,
      },
    ],
    startDay: 3,
    endDay: 21,
    isFrozen: false,
    isInTransit: false,
  },
  {
    id: 'preview-bean-2',
    timestamp: Date.now(),
    name: 'Иргачефф Гокиоко',
    beanType: 'filter',
    price: '168',
    capacity: '200g',
    remaining: '95g',
    roastLevel: 'Светлая обжарка',
    roastDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    flavor: ['Лимон', 'Цветы жасмина', 'Цитрусовые'],
    notes: 'Яркая кислотность, насыщенный цветочный аромат',
    blendComponents: [
      {
        origin: 'Эфиопия',
        process: 'Мытая',
        variety: 'Местные разновидности',
        percentage: 100,
      },
    ],
    startDay: 3,
    endDay: 18,
    isFrozen: false,
    isInTransit: false,
  },
  {
    id: 'preview-bean-3',
    timestamp: Date.now() + 1000,
    name: 'Колумбия Уила',
    beanType: 'espresso',
    price: '185',
    capacity: '250g',
    remaining: '203g',
    roastLevel: 'Средне-тёмная обжарка',
    roastDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    flavor: ['Шоколад', 'Карамель', 'Орехи'],
    notes: 'Плотное тело, сладкое послевкусие — для эспрессо',
    blendComponents: [
      {
        origin: 'Колумбия',
        process: 'Мытая',
        variety: 'Катурра',
        percentage: 100,
      },
    ],
    startDay: 3,
    endDay: 28,
    isFrozen: false,
    isInTransit: false,
  },
];

const BeanPreview: React.FC<BeanPreviewProps> = ({ settings }) => {
  const sampleBeans = createSampleBeans();

  return (
    <>
      {/* 预览标识 - 位于预览区域上方 */}
      <div className="pointer-events-none relative mb-8 h-48 overflow-hidden bg-neutral-50 select-none dark:bg-neutral-900">
        {/* 咖啡豆列表容器 */}
        <div className="absolute inset-0 px-6 py-6">
          <div className="flex h-full flex-col justify-center space-y-5">
            {/* 第一个豆子 - 只露出下半部分 */}
            <div className="transform">
              <BeanPreviewItem bean={sampleBeans[0]} settings={settings} />
            </div>

            {/* 第二个豆子 - 完整显示在中间 */}
            <div className="transform">
              <BeanPreviewItem bean={sampleBeans[1]} settings={settings} />
            </div>

            {/* 第三个豆子 - 只露出上半部分 */}
            <div className="transform">
              <BeanPreviewItem bean={sampleBeans[2]} settings={settings} />
            </div>
          </div>
        </div>

        {/* 上边缘渐变阴影 */}
        <div className="fade-mask-to-b pointer-events-none absolute top-0 right-0 left-0 z-20 h-12 bg-neutral-50 dark:bg-neutral-900/95" />

        {/* 下边缘渐变阴影 */}
        <div className="fade-mask-to-t pointer-events-none absolute right-0 bottom-0 left-0 z-20 h-12 bg-neutral-50 dark:bg-neutral-900/95" />
      </div>
    </>
  );
};

// 简化版的豆子预览组件，基于 BeanListItem 的样式
const BeanPreviewItem: React.FC<{
  bean: ExtendedCoffeeBean;
  settings: SettingsOptions;
}> = ({ bean, settings }) => {
  // 设置默认值
  const dateDisplayMode = settings?.dateDisplayMode ?? 'date';
  const showFlavorInfo = settings?.showFlavorInfo ?? false;
  const showBeanNotes = settings?.showBeanNotes !== false;
  const showNoteContent = settings?.showNoteContent !== false;
  const limitNotesLines = settings?.limitNotesLines ?? true;
  const notesMaxLines = settings?.notesMaxLines ?? 3;
  const showPrice = settings?.showPrice !== false;
  const showTotalPrice = settings?.showTotalPrice ?? false;
  const showStatusDots = settings?.showStatusDots ?? true;

  // 直接使用咖啡豆名称
  const displayTitle = bean.name;

  const formatNumber = (value: string | undefined): string =>
    !value
      ? '0'
      : Number.isInteger(parseFloat(value))
        ? Math.floor(parseFloat(value)).toString()
        : value;

  const formatDateShort = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear().toString().slice(-2);
      return `${year}-${date.getMonth() + 1}-${date.getDate()}`;
    } catch {
      return dateStr;
    }
  };

  const getAgingDaysText = (dateStr: string): string => {
    try {
      const roastDate = new Date(dateStr);
      const today = new Date();
      const daysSinceRoast = Math.ceil(
        (today.getTime() - roastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `Отдых${daysSinceRoast} дн.`;
    } catch {
      return 'Отдых 0 дн.';
    }
  };

  const formatPrice = (price: string, capacity: string): string => {
    const priceNum = parseFloat(price);
    const capacityNum = parseFloat(capacity.replace('g', ''));
    if (isNaN(priceNum) || isNaN(capacityNum) || capacityNum === 0) return '';

    const pricePerGram = (priceNum / capacityNum).toFixed(2);

    if (showTotalPrice) {
      return `${priceNum} ₽ (${pricePerGram} ₽/г)`;
    } else {
      return `${pricePerGram} ₽/г`;
    }
  };

  const getFlavorPeriodStatus = (): string => {
    // 简化的赏味期计算，用于预览
    if (!bean.roastDate) return 'Неизвестное состояние';
    const startDay = bean.startDay || 0;
    const endDay = bean.endDay || 0;

    const daysSinceRoast = Math.ceil(
      (new Date().getTime() - new Date(bean.roastDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (startDay > 0 && daysSinceRoast < startDay) {
      const remainingDays = startDay - daysSinceRoast;
      return `Отдых ${remainingDays} дн.`;
    } else if (endDay > 0 && daysSinceRoast <= endDay) {
      const remainingDays = endDay - daysSinceRoast;
      return `Лучший период ${remainingDays} дн.`;
    } else if (endDay > 0) {
      return 'Выдохлось';
    }

    return getAgingDaysText(bean.roastDate);
  };

  const getStatusDotColor = (): string => {
    if (!bean.roastDate) return 'bg-neutral-400';
    const startDay = bean.startDay || 0;
    const endDay = bean.endDay || 0;

    const daysSinceRoast = Math.ceil(
      (new Date().getTime() - new Date(bean.roastDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (startDay > 0 && daysSinceRoast < startDay) {
      return 'bg-amber-400'; // 养豆期
    } else if (endDay > 0 && daysSinceRoast <= endDay) {
      return 'bg-green-400'; // 赏味期
    } else if (endDay > 0) {
      return 'bg-red-400'; // 衰退期
    }

    return 'bg-neutral-400';
  };

  const shouldShowNotes = () =>
    showBeanNotes &&
    ((showFlavorInfo && bean.flavor?.length) ||
      (showNoteContent && bean.notes));

  const getFullNotesContent = () => {
    const hasFlavor = showFlavorInfo && bean.flavor?.length;
    const hasNotes = showNoteContent && bean.notes && bean.notes.trim() !== '';

    if (hasFlavor && hasNotes) {
      return `${bean.flavor!.join(' · ')}\n${bean.notes!}`;
    }
    if (hasFlavor) {
      return bean.flavor!.join(' · ');
    }
    if (hasNotes) {
      return bean.notes || '';
    }
    return '';
  };

  const getLineClampClass = (lines: number): string => {
    const clampClasses = [
      '',
      'line-clamp-1',
      'line-clamp-2',
      'line-clamp-3',
      'line-clamp-4',
      'line-clamp-5',
      'line-clamp-6',
    ];
    return clampClasses[lines] || 'line-clamp-3';
  };

  return (
    <div className="flex gap-3">
      <div className="relative self-start">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-neutral-200/50 bg-neutral-100 dark:border-neutral-800/50 dark:bg-neutral-800/20">
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-400 dark:text-neutral-600">
            {getBeanDisplayInitial(bean)}
          </div>
        </div>

        {showStatusDots && bean.roastDate && (
          <div
            className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full ${getStatusDotColor()} border-2 border-white dark:border-neutral-900`}
          />
        )}
      </div>

      <div className="flex w-full flex-col gap-y-2">
        <div className={`flex flex-col justify-center gap-y-1.5`}>
          <div className="line-clamp-2 pr-2 text-xs leading-tight font-medium text-neutral-800 dark:text-neutral-100">
            {displayTitle}
          </div>

          <div className="text-xs leading-relaxed font-medium tracking-wide text-neutral-600 dark:text-neutral-400">
            {bean.roastDate && (
              <span className="inline">
                {dateDisplayMode === 'flavorPeriod'
                  ? getFlavorPeriodStatus()
                  : dateDisplayMode === 'agingDays'
                    ? getAgingDaysText(bean.roastDate)
                    : formatDateShort(bean.roastDate)}
                {((bean.capacity && bean.remaining) ||
                  (bean.price && bean.capacity)) && (
                  <span className="mx-2 text-neutral-400 dark:text-neutral-600">
                    ·
                  </span>
                )}
              </span>
            )}

            {bean.capacity && bean.remaining && (
              <span className="inline">
                <span className="border-b border-dashed border-neutral-400 dark:border-neutral-600">
                  {formatNumber(bean.remaining)}
                </span>
                /{formatNumber(bean.capacity)}г
                {showPrice && bean.price && bean.capacity && (
                  <span className="mx-2 text-neutral-400 dark:text-neutral-600">
                    ·
                  </span>
                )}
              </span>
            )}

            {showPrice && bean.price && bean.capacity && (
              <span className="inline">
                {formatPrice(bean.price, bean.capacity)}
              </span>
            )}
          </div>
        </div>

        {shouldShowNotes() && (
          <div className="rounded bg-neutral-200/30 px-1.5 py-1 text-xs font-medium tracking-wide whitespace-pre-line text-neutral-800/70 dark:bg-neutral-800/40 dark:text-neutral-400/85">
            <div
              className={
                limitNotesLines ? getLineClampClass(notesMaxLines) : ''
              }
            >
              {getFullNotesContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeanPreview;
