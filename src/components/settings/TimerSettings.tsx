'use client';

import React from 'react';
import { SettingsOptions } from './Settings';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useModalHistory, modalHistory } from '@/lib/hooks/useModalHistory';
import {
  SettingPage,
  SettingSection,
  SettingRow,
  SettingSelector,
  SettingToggle,
  SettingSlider,
} from './atomic';

import TimerPreview from './TimerPreview';

interface TimerSettingsProps {
  settings: SettingsOptions;
  onClose: () => void;
  handleChange: <K extends keyof SettingsOptions>(
    key: K,
    value: SettingsOptions[K]
  ) => void | Promise<void>;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
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
  const [isVisible, setIsVisible] = React.useState(false);

  // 用于保存最新的 onClose 引用
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 关闭处理函数（带动画）
  const handleCloseWithAnimation = React.useCallback(() => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('subSettingsClosing'));
    setTimeout(() => {
      onCloseRef.current();
    }, 350);
  }, []);

  // 使用统一的历史栈管理系统
  useModalHistory({
    id: 'timer-settings',
    isOpen: true,
    onClose: handleCloseWithAnimation,
    skipPageExitTransitionOnHistory: true,
  });

  // UI 返回按钮点击处理
  const handleClose = () => {
    modalHistory.back();
  };

  // 处理显示/隐藏动画（入场动画）
  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  return (
    <SettingPage title="Таймер" isVisible={isVisible} onClose={handleClose}>
      {/* 预览区域 */}
      <TimerPreview settings={settings} />

      <SettingSection title="Отображение" className="mt-6">
        <SettingRow label="Показывать скорость пролива">
          <SettingToggle
            checked={settings.showFlowRate || false}
            onChange={checked => handleChange('showFlowRate', checked)}
          />
        </SettingRow>
        <SettingRow label="Визуализация заварки">
          <SettingToggle
            checked={settings.showBrewingVisualizer ?? true}
            onChange={checked => handleChange('showBrewingVisualizer', checked)}
          />
        </SettingRow>
        <SettingRow label="Высота шкалы прогресса" vertical>
          <SettingSlider
            min={4}
            max={20}
            step={4}
            value={settings.layoutSettings?.progressBarHeight || 12}
            onChange={val => {
              const newLayoutSettings = {
                ...settings.layoutSettings,
                progressBarHeight: val,
              };
              handleChange('layoutSettings', newLayoutSettings);
            }}
            minLabel="Тонкая"
            maxLabel="Толстая"
            showTicks
          />
        </SettingRow>
        <SettingRow label="Размер шрифта данных" isLast>
          <SettingSelector
            value={settings.layoutSettings?.dataFontSize || '2xl'}
            options={[
              { value: '2xl', label: 'Обычный' },
              { value: '3xl', label: 'Крупный' },
              { value: '4xl', label: 'Очень крупный' },
            ]}
            ariaLabel="Размер шрифта данных"
            onChange={value => {
              const newLayoutSettings = {
                ...settings.layoutSettings,
                dataFontSize: value as '2xl' | '3xl' | '4xl',
              };
              handleChange('layoutSettings', newLayoutSettings);
            }}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Список">
        <SettingRow label="Время этапа" isLast>
          <SettingSelector
            value={settings.layoutSettings?.stepDisplayMode || 'cumulative'}
            options={[
              { value: 'independent', label: 'Отдельно' },
              { value: 'cumulative', label: 'Нарастающим итогом' },
              { value: 'time', label: 'Время' },
            ]}
            ariaLabel="Время этапа"
            onChange={value => {
              const newLayoutSettings = {
                ...settings.layoutSettings,
                stepDisplayMode: value as 'independent' | 'cumulative' | 'time',
              };
              handleChange('layoutSettings', newLayoutSettings);
            }}
          />
        </SettingRow>
      </SettingSection>
    </SettingPage>
  );
};

export default TimerSettings;
