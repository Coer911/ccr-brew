'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SettingsOptions } from './Settings';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useModalHistory, modalHistory } from '@/lib/hooks/useModalHistory';
import SettingPage from './atomic/SettingPage';
import SettingSection from './atomic/SettingSection';
import SettingRow from './atomic/SettingRow';
import SettingSelector from './atomic/SettingSelector';
import SettingSlider from './atomic/SettingSlider';
import SettingToggle from './atomic/SettingToggle';
import { useScrollToHighlightedSetting } from './atomic/SettingSearchHighlightContext';

import BeanEstimatedCupSection from './BeanEstimatedCupSection';
import BeanPreview from './BeanPreview';
import BeanFieldSettingsDrawer from './BeanFieldSettingsDrawer';
import {
  getBeanSettingsSearchRevealState,
  type BeanSettingsSearchRevealState,
} from './settingsSearch';

const EMPTY_SEARCH_REVEAL_STATE: BeanSettingsSearchRevealState = {
  priceDetails: false,
  noteDetails: false,
  ratingDetails: false,
  beanFields: false,
};

interface BeanSettingsProps {
  settings: SettingsOptions;
  onClose: () => void;
  handleChange: <K extends keyof SettingsOptions>(
    key: K,
    value: SettingsOptions[K]
  ) => void | Promise<void>;
}

const BeanSettings: React.FC<BeanSettingsProps> = ({
  settings: _settings,
  onClose,
  handleChange: _handleChange,
}) => {
  const settings = useSettingsStore(state => state.settings) as SettingsOptions;
  const updateSettings = useSettingsStore(state => state.updateSettings);

  const handleChange = React.useCallback(
    async <K extends keyof SettingsOptions>(
      key: K,
      value: SettingsOptions[K]
    ) => {
      await updateSettings({ [key]: value } as any);
    },
    [updateSettings]
  );

  const handleBeanRatingTenthStepChange = React.useCallback(
    (checked: boolean) => {
      handleChange('beanRatingTenthStep', checked);
    },
    [handleChange]
  );

  const [isVisible, setIsVisible] = React.useState(false);
  const [showBeanFieldsDrawer, setShowBeanFieldsDrawer] = React.useState(false);
  const [persistentSearchRevealState, setPersistentSearchRevealState] =
    React.useState(EMPTY_SEARCH_REVEAL_STATE);
  const highlightedSettingId =
    useScrollToHighlightedSetting(showBeanFieldsDrawer);
  const searchRevealState = React.useMemo(
    () => getBeanSettingsSearchRevealState(highlightedSettingId),
    [highlightedSettingId]
  );
  const showPriceDetails =
    settings.showPrice !== false || persistentSearchRevealState.priceDetails;
  const showNoteDetails =
    settings.showBeanNotes !== false || persistentSearchRevealState.noteDetails;
  const showRatingDetails =
    Boolean(settings.showBeanRating) ||
    persistentSearchRevealState.ratingDetails;
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    if (!Object.values(searchRevealState).some(Boolean)) return;

    setPersistentSearchRevealState(current => ({
      priceDetails: current.priceDetails || searchRevealState.priceDetails,
      noteDetails: current.noteDetails || searchRevealState.noteDetails,
      ratingDetails: current.ratingDetails || searchRevealState.ratingDetails,
      beanFields: current.beanFields || searchRevealState.beanFields,
    }));
  }, [searchRevealState]);

  const openBeanFieldsDrawer = React.useCallback(() => {
    setShowBeanFieldsDrawer(true);
  }, []);
  const closeBeanFieldsDrawer = React.useCallback(() => {
    setShowBeanFieldsDrawer(false);
    setPersistentSearchRevealState(current => {
      if (!current.beanFields) return current;
      return { ...current, beanFields: false };
    });
  }, []);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleCloseWithAnimation = React.useCallback(() => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('subSettingsClosing'));
    setTimeout(() => {
      onCloseRef.current();
    }, 350);
  }, []);

  useModalHistory({
    id: 'bean-settings',
    isOpen: true,
    onClose: handleCloseWithAnimation,
    skipPageExitTransitionOnHistory: true,
  });

  const handleClose = () => {
    modalHistory.back();
  };

  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  return (
    <SettingPage title="Зерно" isVisible={isVisible} onClose={handleClose}>
      {/* 预览区域 */}
      <BeanPreview settings={settings} />

      <BeanEstimatedCupSection
        settings={settings}
        handleChange={handleChange}
      />

      <SettingSection title="Список">
        <SettingRow label="Формат даты">
          <SettingSelector
            value={settings.dateDisplayMode || 'date'}
            options={[
              { value: 'date', label: 'Дата' },
              { value: 'flavorPeriod', label: 'Лучший период' },
              { value: 'agingDays', label: 'Дней отдыха' },
            ]}
            ariaLabel="Формат даты"
            onChange={value =>
              handleChange(
                'dateDisplayMode',
                value as 'date' | 'flavorPeriod' | 'agingDays'
              )
            }
          />
        </SettingRow>

        <SettingRow label="Цена">
          <SettingToggle
            checked={settings.showPrice !== false}
            onChange={checked => handleChange('showPrice', checked)}
          />
        </SettingRow>

        {showPriceDetails && (
          <SettingRow label="Общая цена" isSubSetting>
            <SettingToggle
              checked={settings.showTotalPrice || false}
              onChange={checked => handleChange('showTotalPrice', checked)}
            />
          </SettingRow>
        )}

        <SettingRow label="Точка состояния">
          <SettingToggle
            checked={settings.showStatusDots || false}
            onChange={checked => handleChange('showStatusDots', checked)}
          />
        </SettingRow>

        <SettingRow label="Заметка" isLast={!showNoteDetails}>
          <SettingToggle
            checked={settings.showBeanNotes !== false}
            onChange={checked => handleChange('showBeanNotes', checked)}
          />
        </SettingRow>

        {showNoteDetails && (
          <>
            <SettingRow label="Вкусы" isSubSetting>
              <SettingToggle
                checked={settings.showFlavorInfo || false}
                onChange={checked => handleChange('showFlavorInfo', checked)}
              />
            </SettingRow>
            <SettingRow label="Текст заметки" isSubSetting>
              <SettingToggle
                checked={settings.showNoteContent !== false}
                onChange={checked => handleChange('showNoteContent', checked)}
              />
            </SettingRow>
            <SettingRow
              label="Строк заметки"
              isLast={!settings.limitNotesLines}
              isSubSetting
            >
              <SettingToggle
                checked={settings.limitNotesLines || false}
                onChange={checked => handleChange('limitNotesLines', checked)}
              />
            </SettingRow>
            {settings.limitNotesLines && (
              <SettingRow isLast vertical>
                <SettingSlider
                  min={1}
                  max={5}
                  step={1}
                  value={settings.notesMaxLines || 3}
                  onChange={val => handleChange('notesMaxLines', val)}
                  minLabel="1 строка"
                  maxLabel="5 строк"
                  showTicks
                />
              </SettingRow>
            )}
          </>
        )}
      </SettingSection>

      <SettingSection title="Карточка">
        <SettingRow label="Печать этикеток">
          <SettingToggle
            checked={settings.enableBeanPrint || false}
            onChange={checked => handleChange('enableBeanPrint', checked)}
          />
        </SettingRow>
        <SettingRow label="Оценка" isLast={!showRatingDetails}>
          <SettingToggle
            checked={settings.showBeanRating || false}
            onChange={checked => handleChange('showBeanRating', checked)}
          />
        </SettingRow>
        {showRatingDetails && (
          <SettingRow label="Десятибалльная шкала" isSubSetting isLast>
            <SettingToggle
              checked={settings.beanRatingTenthStep || false}
              onChange={handleBeanRatingTenthStepChange}
            />
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="Добавление">
        <SettingRow label="Форма на весь экран">
          <SettingToggle
            checked={settings.immersiveAdd || false}
            onChange={checked => handleChange('immersiveAdd', checked)}
          />
        </SettingRow>
        <SettingRow label="Автозаполнение фото" isLast>
          <SettingToggle
            checked={settings.autoFillRecognitionImage || false}
            onChange={checked =>
              handleChange('autoFillRecognitionImage', checked)
            }
          />
        </SettingRow>
      </SettingSection>

      <SettingSection>
        <SettingRow label="Поля зерна" isLast onClick={openBeanFieldsDrawer}>
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </SettingRow>
      </SettingSection>

      <BeanFieldSettingsDrawer
        isOpen={showBeanFieldsDrawer || persistentSearchRevealState.beanFields}
        onClose={closeBeanFieldsDrawer}
      />
    </SettingPage>
  );
};

export default BeanSettings;
