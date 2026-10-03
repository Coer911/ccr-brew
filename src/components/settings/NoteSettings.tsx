'use client';

import React from 'react';

import { SettingsOptions } from './Settings';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useModalHistory, modalHistory } from '@/lib/hooks/useModalHistory';
import SettingPage from './atomic/SettingPage';
import SettingSection from './atomic/SettingSection';
import SettingRow from './atomic/SettingRow';
import SettingToggle from './atomic/SettingToggle';

interface NoteSettingsProps {
  settings: SettingsOptions;
  onClose: () => void;
  handleChange: <K extends keyof SettingsOptions>(
    key: K,
    value: SettingsOptions[K]
  ) => void;
}

const NoteSettings: React.FC<NoteSettingsProps> = ({
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
      await updateSettings({ [key]: value } as Partial<SettingsOptions>);
    },
    [updateSettings]
  );

  const handleHalfStepChange = React.useCallback(
    async (checked: boolean) => {
      await updateSettings({
        flavorRatingHalfStep: checked,
        ...(checked ? { flavorRatingTenthStep: false } : {}),
      });
    },
    [updateSettings]
  );

  const handleTenthStepChange = React.useCallback(
    async (checked: boolean) => {
      await updateSettings({
        flavorRatingTenthStep: checked,
        ...(checked ? { flavorRatingHalfStep: false } : {}),
      });
    },
    [updateSettings]
  );

  // 控制动画状态
  const [isVisible, setIsVisible] = React.useState(false);

  // 关闭处理函数（带动画）
  const handleCloseWithAnimation = React.useCallback(() => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('subSettingsClosing'));
    setTimeout(() => {
      onClose();
    }, 350);
  }, [onClose]);

  // 使用统一的历史栈管理系统
  useModalHistory({
    id: 'note-settings',
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
    <SettingPage title="Заметки" isVisible={isVisible} onClose={handleClose}>
      <SettingSection title="Список" className="-mt-4">
        <SettingRow
          label="Классический список"
          isLast={settings.useClassicNotesListStyle ?? false}
        >
          <SettingToggle
            checked={settings.useClassicNotesListStyle ?? false}
            onChange={checked =>
              handleChange('useClassicNotesListStyle', checked)
            }
          />
        </SettingRow>
        {!(settings.useClassicNotesListStyle ?? false) && (
          <SettingRow label="Вход в критерии оценки" isSubSetting isLast>
            <SettingToggle
              checked={settings.showRatingDimensionsEntry ?? false}
              onChange={checked =>
                handleChange('showRatingDimensionsEntry', checked)
              }
            />
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="Подробности">
        <SettingRow label="Цена">
          <SettingToggle
            checked={settings.showUnitPriceInNote ?? false}
            onChange={checked => handleChange('showUnitPriceInNote', checked)}
          />
        </SettingRow>
        <SettingRow label="Отдых">
          <SettingToggle
            checked={settings.showBeanAgingDaysInNote ?? false}
            onChange={checked =>
              handleChange('showBeanAgingDaysInNote', checked)
            }
          />
        </SettingRow>
        <SettingRow label="Вкусы">
          <SettingToggle
            checked={settings.showFlavorInNote ?? true}
            onChange={checked => handleChange('showFlavorInNote', checked)}
          />
        </SettingRow>
        <SettingRow label="Время" isLast>
          <SettingToggle
            checked={settings.showNoteTimeInNote ?? true}
            onChange={checked => handleChange('showNoteTimeInNote', checked)}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Форма">
        <SettingRow
          label="Оценка"
          isLast={!(settings.showOverallRatingInForm ?? true)}
        >
          <SettingToggle
            checked={settings.showOverallRatingInForm ?? true}
            onChange={checked =>
              handleChange('showOverallRatingInForm', checked)
            }
          />
        </SettingRow>
        {(settings.showOverallRatingInForm ?? true) && (
          <SettingRow label="Оценивать ползунком" isSubSetting isLast>
            <SettingToggle
              checked={
                (settings.overallRatingUseSlider ?? false) ||
                (settings.flavorRatingTenthStep ?? false)
              }
              disabled={settings.flavorRatingTenthStep ?? false}
              onChange={checked =>
                handleChange('overallRatingUseSlider', checked)
              }
            />
          </SettingRow>
        )}
      </SettingSection>

      {/* 评分开启时，显示风味评分相关设置 */}
      {(settings.showOverallRatingInForm ?? true) && (
        <SettingSection>
          <SettingRow
            label="Оценка вкуса"
            isLast={!(settings.showFlavorRatingInForm ?? true)}
          >
            <SettingToggle
              checked={settings.showFlavorRatingInForm ?? true}
              onChange={checked =>
                handleChange('showFlavorRatingInForm', checked)
              }
            />
          </SettingRow>
          {/* 风味评分开启时，显示其相关设置 */}
          {(settings.showFlavorRatingInForm ?? true) && (
            <>
              <SettingRow label="Шаг 0,5" isSubSetting>
                <SettingToggle
                  checked={
                    (settings.flavorRatingHalfStep ?? false) &&
                    !(settings.flavorRatingTenthStep ?? false)
                  }
                  onChange={handleHalfStepChange}
                />
              </SettingRow>
              <SettingRow label="Десятибалльная шкала" isSubSetting>
                <SettingToggle
                  checked={settings.flavorRatingTenthStep ?? false}
                  onChange={handleTenthStepChange}
                />
              </SettingRow>
              <SettingRow label="Начальное значение = общая оценка" isSubSetting isLast>
                <SettingToggle
                  checked={settings.flavorRatingFollowOverall ?? false}
                  onChange={checked =>
                    handleChange('flavorRatingFollowOverall', checked)
                  }
                />
              </SettingRow>
            </>
          )}
        </SettingSection>
      )}

      <SettingSection title="Записи">
        <SettingRow label="Записи об изменении остатка" isLast>
          <SettingToggle
            checked={settings.showCapacityAdjustmentRecords ?? true}
            onChange={checked =>
              handleChange('showCapacityAdjustmentRecords', checked)
            }
          />
        </SettingRow>
      </SettingSection>
    </SettingPage>
  );
};

export default NoteSettings;
