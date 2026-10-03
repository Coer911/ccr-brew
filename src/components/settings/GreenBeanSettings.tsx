'use client';

import React, { useState, useEffect } from 'react';
import { SettingsOptions, defaultSettings } from './Settings';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import hapticsUtils from '@/lib/ui/haptics';
import { useModalHistory, modalHistory } from '@/lib/hooks/useModalHistory';
import {
  SettingPage,
  SettingSection,
  SettingRow,
  SettingToggle,
  useScrollToHighlightedSetting,
} from './atomic';
import {
  makeSettingRowSearchId,
  shouldRevealGreenBeanSearchSettings,
} from './settingsSearch';

interface GreenBeanSettingsProps {
  settings: SettingsOptions;
  onClose: () => void;
  handleChange: <K extends keyof SettingsOptions>(
    key: K,
    value: SettingsOptions[K]
  ) => void | Promise<void>;
}

const GreenBeanSettings: React.FC<GreenBeanSettingsProps> = ({
  settings: _settings,
  onClose,
  handleChange: _handleChange,
}) => {
  // 使用 settingsStore 获取设置
  const settings = useSettingsStore(state => state.settings) as SettingsOptions;
  const updateSettings = useSettingsStore(state => state.updateSettings);

  // 使用 settingsStore 的 handleChange
  const handleChange = React.useCallback(
    async <K extends keyof SettingsOptions>(
      key: K,
      value: SettingsOptions[K]
    ) => {
      await updateSettings({ [key]: value } as any);
    },
    [updateSettings]
  );

  // 控制动画状态
  const [isVisible, setIsVisible] = useState(false);

  // 用于保存最新的 onClose 引用
  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 关闭处理函数（带动画）
  const handleCloseWithAnimation = React.useCallback(() => {
    // 立即触发退出动画
    setIsVisible(false);

    // 立即通知父组件子设置正在关闭
    window.dispatchEvent(new CustomEvent('subSettingsClosing'));

    // 等待动画完成后真正关闭
    setTimeout(() => {
      onCloseRef.current();
    }, 350); // 与 IOS_TRANSITION_CONFIG.duration 一致
  }, []);

  // 使用统一的历史栈管理系统
  useModalHistory({
    id: 'green-bean-settings',
    isOpen: true, // 子设置页面挂载即为打开状态
    onClose: handleCloseWithAnimation,
    skipPageExitTransitionOnHistory: true,
  });

  // UI 返回按钮点击处理
  const handleClose = () => {
    modalHistory.back();
  };

  // 处理显示/隐藏动画（入场动画）
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  // ===== 生豆烘焙预设值状态 =====
  const [greenBeanRoastValue, setGreenBeanRoastValue] = useState<string>('');
  const [greenBeanRoastPresets, setGreenBeanRoastPresets] = useState<number[]>(
    settings.greenBeanRoastPresets || defaultSettings.greenBeanRoastPresets
  );

  useEffect(() => {
    if (settings.greenBeanRoastPresets) {
      setGreenBeanRoastPresets(settings.greenBeanRoastPresets);
    }
  }, [settings.greenBeanRoastPresets]);

  const addGreenBeanRoastPreset = () => {
    const value = parseFloat(greenBeanRoastValue);
    if (!isNaN(value) && value > 0) {
      const formattedValue = parseFloat(value.toFixed(1));
      if (!greenBeanRoastPresets.includes(formattedValue)) {
        const newPresets = [...greenBeanRoastPresets, formattedValue].sort(
          (a, b) => a - b
        );
        setGreenBeanRoastPresets(newPresets);
        handleChange('greenBeanRoastPresets', newPresets);
        setGreenBeanRoastValue('');
        if (settings.hapticFeedback) {
          hapticsUtils.light();
        }
      }
    }
  };

  const removeGreenBeanRoastPreset = (value: number) => {
    const newPresets = greenBeanRoastPresets.filter(v => v !== value);
    setGreenBeanRoastPresets(newPresets);
    handleChange('greenBeanRoastPresets', newPresets);
    if (settings.hapticFeedback) {
      hapticsUtils.light();
    }
  };

  const highlightedSettingId = useScrollToHighlightedSetting(
    greenBeanRoastPresets.join(',')
  );
  const isPresetSectionHighlighted =
    highlightedSettingId === makeSettingRowSearchId('Быстрые веса обжарки');
  const [hasRevealedSearchDetails, setHasRevealedSearchDetails] =
    React.useState(false);
  const shouldRevealSearchDetails = shouldRevealGreenBeanSearchSettings(
    highlightedSettingId
  );

  React.useEffect(() => {
    if (shouldRevealSearchDetails) {
      setHasRevealedSearchDetails(true);
    }
  }, [shouldRevealSearchDetails]);

  const showGreenBeanDetails =
    Boolean(settings.enableGreenBeanInventory) ||
    hasRevealedSearchDetails;

  return (
    <SettingPage title="Зелёное зерно" isVisible={isVisible} onClose={handleClose}>
      <SettingSection
        title="Зелёное зерно"
        footer="В обзоре запасов нажмите «Зерно», чтобы переключаться между зелёным и обжаренным"
        className="-mt-4"
      >
        <SettingRow label="Включить учёт зелёного зерна" isLast>
          <SettingToggle
            checked={settings.enableGreenBeanInventory || false}
            onChange={checked =>
              handleChange('enableGreenBeanInventory', checked)
            }
          />
        </SettingRow>
      </SettingSection>

      {showGreenBeanDetails && (
        <>
          <SettingSection title="Быстрая обжарка">
            <SettingRow
              label={'Включить «Обжарить всё»'}
              description="Показывать кнопку ALL, чтобы обжарить весь остаток сразу"
            >
              <SettingToggle
                checked={
                  settings.enableAllGreenBeanRoastOption ??
                  defaultSettings.enableAllGreenBeanRoastOption
                }
                onChange={checked =>
                  handleChange('enableAllGreenBeanRoastOption', checked)
                }
              />
            </SettingRow>
            <SettingRow
              label="Разрешить свой вес обжарки"
              description="Можно вводить любое число в окне быстрой обжарки"
              isLast
            >
              <SettingToggle
                checked={
                  settings.enableCustomGreenBeanRoastInput ??
                  defaultSettings.enableCustomGreenBeanRoastInput
                }
                onChange={checked =>
                  handleChange('enableCustomGreenBeanRoastInput', checked)
                }
              />
            </SettingRow>
          </SettingSection>

          <SettingSection title="Быстрые веса обжарки">
            <div
              data-settings-search-id={makeSettingRowSearchId('Быстрые веса обжарки')}
              className={`p-4 transition-colors ${
                isPresetSectionHighlighted
                  ? 'bg-neutral-200/70 dark:bg-neutral-700/45'
                  : ''
              }`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {greenBeanRoastPresets.map(value => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => removeGreenBeanRoastPreset(value)}
                    className="cursor-pointer rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                  >
                    -{value}g ×
                  </button>
                ))}

                <div className="flex h-9">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={greenBeanRoastValue}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      const dotCount = (value.match(/\./g) || []).length;
                      let sanitizedValue =
                        dotCount > 1
                          ? value.substring(0, value.lastIndexOf('.'))
                          : value;
                      const dotIndex = sanitizedValue.indexOf('.');
                      if (
                        dotIndex !== -1 &&
                        dotIndex < sanitizedValue.length - 2
                      ) {
                        sanitizedValue = sanitizedValue.substring(
                          0,
                          dotIndex + 2
                        );
                      }
                      setGreenBeanRoastValue(sanitizedValue);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addGreenBeanRoastPreset();
                      }
                    }}
                    placeholder="Граммы"
                    className="w-16 rounded-l rounded-r-none bg-neutral-200 px-2 py-1.5 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-hidden dark:bg-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={addGreenBeanRoastPreset}
                    disabled={
                      !greenBeanRoastValue ||
                      isNaN(parseFloat(greenBeanRoastValue)) ||
                      parseFloat(greenBeanRoastValue) <= 0
                    }
                    className="cursor-pointer rounded-r bg-neutral-700 px-2 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-20 dark:bg-neutral-600"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Нажмите на вес, чтобы удалить его; введите граммы и нажмите Enter или «+», чтобы добавить.
              </p>
            </div>
          </SettingSection>

          <SettingSection
            title="Преобразование данных"
            footer={
              <div className="space-y-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                <p>
                  До появления учёта зелёного зерна вы могли вести его как обжаренное. Эта функция переведёт старые записи в правильный формат.
                </p>
                <p>
                  После преобразования израсходованная часть станет «обжаркой + новым обжаренным зерном», а остаток останется зелёным. Заметки о заварке перейдут к новому зерну, записи быстрого списания будут очищены.
                </p>
                <p className="text-neutral-400 dark:text-neutral-500">
                  Только для обжаренного зерна без привязки к зелёному. Данные меняются сильно — сначала сделайте копию.
                </p>
              </div>
            }
          >
            <SettingRow label="Обжаренное → зелёное" isLast>
              <SettingToggle
                checked={settings.enableConvertToGreen || false}
                onChange={checked =>
                  handleChange('enableConvertToGreen', checked)
                }
              />
            </SettingRow>
          </SettingSection>
        </>
      )}
    </SettingPage>
  );
};

export default GreenBeanSettings;
