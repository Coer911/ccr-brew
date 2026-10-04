'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import { ChevronLeft } from 'lucide-react';
import { BrewingNote, equipmentList, CustomEquipment } from '@/lib/core/config';
import { useCoffeeBeanStore } from '@/lib/stores/coffeeBeanStore';
import { loadCustomEquipments } from '@/lib/stores/customEquipmentStore';
import { useFlavorDimensions } from '@/lib/hooks/useFlavorDimensions';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useCopy } from '@/lib/hooks/useCopy';
import CopyFailureDrawer from '@/components/common/feedback/CopyFailureDrawer';
import { TempFileManager } from '@/lib/utils/tempFileManager';
import { showToast } from '@/components/common/feedback/LightToast';
import { formatNoteBeanDisplayName } from '@/lib/utils/beanVarietyUtils';
import { normalizeBrewingNoteParams } from '@/lib/notes/noteDisplay';
import { useCoffeeBeanImage } from '@/lib/hooks/useCoffeeBeanImage';
import { useBrewingNoteImages } from '@/lib/hooks/useBrewingNoteImages';

interface ArtisticShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  note: BrewingNote;
}

type Tab = 'text' | 'bean-image' | 'note-image';
type ShareRatingStyle = 'number' | 'dots' | 'bar';

const DEFAULT_TAB_LABELS: Record<Tab, string> = {
  text: 'Текст',
  'note-image': 'Фото заварки',
  'bean-image': 'Фото зерна',
};

const DEFAULT_SHARE_TAGS = '#кофе #пуровер #кофейныезаметки #CulturaBrew';
const HEADER_ICON_BUTTON_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100';
const HEADER_TEXT_BUTTON_CLASS =
  'inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 px-4 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100';

const RATING_STYLE_OPTIONS: Array<{
  value: ShareRatingStyle;
  label: string;
}> = [
  { value: 'number', label: 'Цифры' },
  { value: 'dots', label: 'Точки' },
  { value: 'bar', label: 'Шкала' },
];

const formatTasteRatingValue = (value: number): string => {
  const normalized = Math.max(0, Math.min(5, value));
  return Number.isInteger(normalized)
    ? normalized.toString()
    : normalized.toFixed(1);
};

const renderTasteRatingValue = (
  value: number,
  style: ShareRatingStyle
): string => {
  const normalized = Math.max(0, Math.min(5, value));
  const formattedValue = formatTasteRatingValue(normalized);

  if (style === 'dots') {
    const filled = Math.round(normalized);
    return `${'●'.repeat(filled)}${'○'.repeat(5 - filled)}`;
  }

  if (style === 'bar') {
    const filled = Math.round((normalized / 5) * 10);
    return `${'■'.repeat(filled)}${'□'.repeat(10 - filled)} ${formattedValue}`;
  }

  return formattedValue;
};

const ArtisticShareDrawer: React.FC<ArtisticShareDrawerProps> = ({
  isOpen,
  onClose,
  note,
}) => {
  const [viewState, setViewState] = useState({
    activeTab: 'text' as Tab,
    isSettingsOpen: false,
  });
  const [equipmentName, setEquipmentName] = useState(note.equipment || '');
  const [isEspresso, setIsEspresso] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const { activeTab, isSettingsOpen } = viewState;

  // 统一的复制功能
  const { copyText, failureDrawerProps } = useCopy({
    successMessage: 'Текст скопирован',
  });

  // 从 Store 获取咖啡豆数据
  const allBeans = useCoffeeBeanStore(state => state.beans);
  const bean = useMemo(
    () =>
      note.beanId ? allBeans.find(b => b.id === note.beanId) || null : null,
    [allBeans, note.beanId]
  );
  const beanImage = useCoffeeBeanImage(bean?.id, {
    fallback: bean?.image,
    preferThumbnail: false,
  });
  const inlineNoteImages = useMemo(() => {
    if (note.images && note.images.length > 0) return note.images;
    if (note.image) return [note.image];
    return [];
  }, [note.images, note.image]);
  const noteImage = useBrewingNoteImages(note.id, inlineNoteImages)[0];

  // 获取烘焙商相关设置
  const roasterFieldEnabled = useSettingsStore(
    state => state.settings.roasterFieldEnabled
  );
  const roasterSeparator = useSettingsStore(
    state => state.settings.roasterSeparator
  );
  const shareRatingStyle =
    useSettingsStore(state => state.settings.artisticShareRatingStyle) ??
    'dots';
  const shareTags =
    useSettingsStore(state => state.settings.artisticShareTags) ??
    DEFAULT_SHARE_TAGS;
  const updateSettings = useSettingsStore(state => state.updateSettings);

  // 获取风味评分维度
  const { getValidTasteRatings } = useFlavorDimensions();

  const handleOpenSettings = React.useCallback(() => {
    setViewState(current => ({ ...current, isSettingsOpen: true }));
  }, []);

  const handleCloseSettings = React.useCallback(() => {
    setViewState(current => ({ ...current, isSettingsOpen: false }));
  }, []);

  const handleRatingStyleChange = React.useCallback(
    (style: ShareRatingStyle) => {
      void updateSettings({ artisticShareRatingStyle: style });
    },
    [updateSettings]
  );

  const handleShareTagsChange = React.useCallback(
    (value: string) => {
      void updateSettings({
        artisticShareTags: value,
      });
    },
    [updateSettings]
  );

  const handleResetShareSettings = React.useCallback(() => {
    void updateSettings({
      artisticShareRatingStyle: 'dots',
      artisticShareTags: DEFAULT_SHARE_TAGS,
    });
  }, [updateSettings]);

  const handleTextClick = () => {
    if (textRef.current) {
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  // Load equipment name
  useEffect(() => {
    const loadEquipmentName = async () => {
      // Reset first
      setIsEspresso(note.equipment === 'Espresso');

      // 1. Check system equipment
      const systemEquipment = equipmentList.find(e => e.id === note.equipment);
      if (systemEquipment) {
        setEquipmentName(systemEquipment.name);
        return;
      }

      // 2. Check custom equipment
      try {
        const customEquipments = await loadCustomEquipments();
        const customEquipment = customEquipments.find(
          (e: CustomEquipment) => e.id === note.equipment
        );
        if (customEquipment) {
          setEquipmentName(customEquipment.name);
          if (customEquipment.animationType === 'espresso') {
            setIsEspresso(true);
          }
        }
      } catch (error) {
        console.error('Failed to load custom equipment:', error);
      }
    };
    loadEquipmentName();
  }, [note.equipment]);

  useEffect(() => {
    if (!isOpen) {
      // Reset to text tab when closed
      const resetTimer = window.setTimeout(() => {
        setViewState({ activeTab: 'text', isSettingsOpen: false });
      }, 300);
      return () => window.clearTimeout(resetTimer);
    }
  }, [isOpen]);

  const tabs = useMemo(() => {
    const list: { id: Tab; label: string }[] = [
      { id: 'text', label: DEFAULT_TAB_LABELS.text },
    ];
    if (noteImage)
      list.push({
        id: 'note-image',
        label: DEFAULT_TAB_LABELS['note-image'],
      });
    if (beanImage)
      list.push({
        id: 'bean-image',
        label: DEFAULT_TAB_LABELS['bean-image'],
      });
    return list;
  }, [beanImage, noteImage]);

  /**
   * 使用纯 Canvas API 生成图片
   * 这是最可靠的跨平台方案，不依赖任何 DOM 转图片库
   */
  const generateImageWithCanvas = async (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Canvas 尺寸（3x 高清）
        const scale = 3;
        const canvasSize = 280 * scale;
        const padding = 24 * scale;

        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Не удалось создать Canvas'));
          return;
        }

        // 1. 绘制背景
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // 2. 计算图片尺寸（保持比例，适应容器）
        const maxImgSize = canvasSize - padding * 2;
        let imgWidth = img.naturalWidth;
        let imgHeight = img.naturalHeight;

        const imgRatio = imgWidth / imgHeight;
        if (imgRatio > 1) {
          // 宽图
          imgWidth = maxImgSize;
          imgHeight = maxImgSize / imgRatio;
        } else {
          // 高图或方图
          imgHeight = maxImgSize;
          imgWidth = maxImgSize * imgRatio;
        }

        const imgX = (canvasSize - imgWidth) / 2;
        const imgY = (canvasSize - imgHeight) / 2;

        // 3. 绘制图片
        ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

        // 导出为 PNG
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Не удалось загрузить картинку'));
      };

      img.src = imageSrc;
    });
  };

  const handleSaveImage = async () => {
    const imageSrc =
      activeTab === 'bean-image'
        ? beanImage
        : activeTab === 'note-image'
          ? noteImage
          : null;
    const filename =
      activeTab === 'bean-image' ? `bean-${note.id}` : `note-${note.id}`;

    if (!imageSrc || isGenerating) return;

    setIsGenerating(true);
    try {
      const dataUrl = await generateImageWithCanvas(imageSrc);

      const shareOutcome = await TempFileManager.shareImageFile(
        dataUrl,
        filename,
        {
          title: 'Поделиться картинкой',
          text: 'Поделиться картинкой',
          dialogTitle: 'Сохранить картинку',
        }
      );

      showToast({
        type: shareOutcome === 'cancelled' ? 'info' : 'success',
        title:
          shareOutcome === 'activation-required'
            ? 'Картинка готова, нажмите «Поделиться» ещё раз'
            : shareOutcome === 'cancelled'
              ? 'Отправка отменена'
              : 'Картинка готова',
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      showToast({ type: 'error', title: 'Не удалось создать картинку' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    await copyText(text);
  };

  const generateShareText = () => {
    const parts = [];

    // Title - 单独一行作为标题，使用格式化函数
    const beanName =
      formatNoteBeanDisplayName(note.coffeeBeanInfo, {
        roasterFieldEnabled,
        roasterSeparator,
      }) || 'Кофейная заметка';
    parts.push(`${beanName}`);
    parts.push(''); // 空行分隔标题和内容

    // Basic Info - Combine Equipment and Method
    const metaInfo = [];
    if (equipmentName) metaInfo.push(equipmentName);
    if (note.method) metaInfo.push(note.method);

    if (metaInfo.length > 0) {
      parts.push(metaInfo.join(' · '));
    }

    // Params
    const cleanValue = (val: string) => val.replace(/[a-zA-Z°]+$/, '').trim();
    const normalizedParams = normalizeBrewingNoteParams(note.params);
    const params = [];

    if (isEspresso && normalizedParams) {
      // 意式：粉量、研磨度、萃取时间、液重
      if (normalizedParams.coffee && normalizedParams.coffee !== '0')
        params.push(`Доза ${cleanValue(normalizedParams.coffee)}g`);

      if (normalizedParams.grindSize)
        params.push(`Помол ${normalizedParams.grindSize}`);

      if (note.totalTime && note.totalTime > 0)
        params.push(`Время ${note.totalTime}s`);

      if (normalizedParams.water && normalizedParams.water !== '0')
        params.push(`Выход ${cleanValue(normalizedParams.water)}g`);
    } else if (normalizedParams) {
      // 手冲：粉量、粉水比、研磨度、水温
      if (normalizedParams.coffee && normalizedParams.coffee !== '0')
        params.push(`Доза ${cleanValue(normalizedParams.coffee)}g`);

      if (normalizedParams.ratio && normalizedParams.ratio !== '1:0')
        params.push(`Соотношение ${normalizedParams.ratio}`);

      if (normalizedParams.grindSize)
        params.push(`Помол ${normalizedParams.grindSize}`);

      if (normalizedParams.temp && normalizedParams.temp !== '0')
        params.push(`Темп. воды ${cleanValue(normalizedParams.temp)}°C`);
    }

    if (params.length > 0) {
      parts.push(params.join('  |  '));
    }

    // Taste - 动态显示所有评分维度
    if (note.taste) {
      const validRatings = getValidTasteRatings(note.taste);

      if (validRatings.length > 0) {
        parts.push(''); // 在参数和风味之间加空行分组

        if (shareRatingStyle === 'bar') {
          validRatings.forEach(rating => {
            parts.push(
              `${rating.label} ${renderTasteRatingValue(rating.value, shareRatingStyle)}`
            );
          });
        } else {
          // 非刻度模式保持紧凑排版：每两个评分一行
          for (let i = 0; i < validRatings.length; i += 2) {
            const first = validRatings[i];
            const second = validRatings[i + 1];

            let line = `${first.label} ${renderTasteRatingValue(first.value, shareRatingStyle)}`;
            if (second) {
              line += `   ${second.label} ${renderTasteRatingValue(second.value, shareRatingStyle)}`;
            }
            parts.push(line);
          }
        }
      }
    }

    // Rating
    if (note.rating && note.rating > 0) {
      parts.push(`Оценка: ${note.rating}/5`);
    }

    // Notes
    if (note.notes && note.notes.trim()) {
      parts.push('');
      parts.push(note.notes.trim());
    }

    const normalizedTags = shareTags.trim();
    if (normalizedTags) {
      parts.push('');
      parts.push(normalizedTags);
    }

    return parts.join('\n');
  };

  const renderImagePreview = (imageSrc: string | undefined) => {
    if (!imageSrc) return null;

    return (
      <div className="w-full">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[#f5f5f5]">
          <div className="relative flex h-full w-full items-center justify-center p-8">
            <img
              src={imageSrc}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <ActionDrawer isOpen={isOpen} onClose={onClose} historyId="artistic-share">
      <>
        <div className="relative mb-4 flex items-center justify-between gap-3">
          {isSettingsOpen ? (
            <button
              type="button"
              onClick={handleCloseSettings}
              className={HEADER_ICON_BUTTON_CLASS}
              title="Назад"
              aria-label="Назад"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : tabs.length > 1 ? (
            <div className="inline-flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
              {tabs.map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() =>
                    setViewState(current => ({
                      ...current,
                      activeTab: tab.id,
                    }))
                  }
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-[color,background-color,box-shadow] ${
                    activeTab === tab.id
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
              <button
                type="button"
                aria-disabled="true"
                tabIndex={-1}
                className="cursor-default rounded-full bg-white px-4 py-1.5 text-xs font-medium text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
              >
                {tabs[0]?.label ?? DEFAULT_TAB_LABELS.text}
              </button>
            </div>
          )}

          {isSettingsOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Настройки картинки
            </div>
          )}

          {isSettingsOpen ? (
            <button
              type="button"
              onClick={handleResetShareSettings}
              className={HEADER_TEXT_BUTTON_CLASS}
              title="По умолчанию"
              aria-label="По умолчанию"
            >
              Вернуть
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenSettings}
              className={HEADER_TEXT_BUTTON_CLASS}
            >
              Настройки
            </button>
          )}
        </div>

        {isSettingsOpen ? (
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
                Оценка вкуса
              </div>
              <div className="grid grid-cols-3 rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
                {RATING_STYLE_OPTIONS.map(option => {
                  const isActive = shareRatingStyle === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRatingStyleChange(option.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
                Текст подписи
              </div>
              <input
                aria-label="Текст подписи"
                value={shareTags}
                onChange={event => handleShareTagsChange(event.target.value)}
                placeholder={DEFAULT_SHARE_TAGS}
                className="h-9 w-full rounded-lg bg-neutral-100 px-3 text-sm text-neutral-800 transition-colors outline-none placeholder:text-neutral-400 focus:bg-neutral-200/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:focus:bg-neutral-800"
              />
            </div>

            <ActionDrawer.PrimaryButton
              onClick={handleCloseSettings}
              className="w-full"
            >
              Готово
            </ActionDrawer.PrimaryButton>
          </div>
        ) : (
          <>
            <ActionDrawer.Switcher activeKey={activeTab}>
              {activeTab === 'text' ? (
                <div
                  ref={textRef}
                  onClick={handleTextClick}
                  data-vaul-no-drag
                  className="max-h-[300px] w-full cursor-text overflow-y-auto rounded-2xl bg-neutral-50 p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-neutral-600 select-text dark:bg-neutral-800/50 dark:text-neutral-400"
                >
                  {generateShareText()}
                </div>
              ) : activeTab === 'bean-image' ? (
                renderImagePreview(beanImage)
              ) : (
                renderImagePreview(noteImage)
              )}
            </ActionDrawer.Switcher>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <ActionDrawer.SecondaryButton
                onClick={onClose}
                className="w-full"
              >
                Отмена
              </ActionDrawer.SecondaryButton>
              <ActionDrawer.PrimaryButton
                onClick={
                  activeTab === 'text' ? handleCopyText : handleSaveImage
                }
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating
                  ? 'Готовим...'
                  : activeTab === 'text'
                    ? 'Скопировать текст'
                    : 'Сохранить картинку'}
              </ActionDrawer.PrimaryButton>
            </div>
          </>
        )}
      </>

      {/* 复制失败抽屉 */}
      <CopyFailureDrawer {...failureDrawerProps} />
    </ActionDrawer>
  );
};

export default ArtisticShareDrawer;
