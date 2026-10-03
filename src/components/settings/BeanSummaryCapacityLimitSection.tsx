'use client';

import React from 'react';

import { SettingsOptions } from './Settings';
import {
  SettingPillInput,
  SettingRow,
  SettingSection,
  SettingToggle,
} from './atomic';

interface BeanSummaryCapacityLimitSectionProps {
  settings: SettingsOptions;
  handleChange: <K extends keyof SettingsOptions>(
    key: K,
    value: SettingsOptions[K]
  ) => void | Promise<void>;
}

const DEFAULT_MAX_DISPLAY_CAPACITY = 1000;

const BeanSummaryCapacityLimitSection: React.FC<
  BeanSummaryCapacityLimitSectionProps
> = ({ settings, handleChange }) => {
  const [capacityInput, setCapacityInput] = React.useState(
    String(
      settings.beanSummaryMaxDisplayCapacity || DEFAULT_MAX_DISPLAY_CAPACITY
    )
  );

  React.useEffect(() => {
    setCapacityInput(
      String(
        settings.beanSummaryMaxDisplayCapacity || DEFAULT_MAX_DISPLAY_CAPACITY
      )
    );
  }, [settings.beanSummaryMaxDisplayCapacity]);

  const commitCapacityInput = React.useCallback(async () => {
    const parsedValue = Number.parseInt(capacityInput, 10);
    const nextValue =
      Number.isFinite(parsedValue) && parsedValue > 0
        ? parsedValue
        : DEFAULT_MAX_DISPLAY_CAPACITY;

    setCapacityInput(String(nextValue));

    if (
      nextValue !==
      (settings.beanSummaryMaxDisplayCapacity || DEFAULT_MAX_DISPLAY_CAPACITY)
    ) {
      await handleChange('beanSummaryMaxDisplayCapacity', nextValue);
    }
  }, [capacityInput, handleChange, settings.beanSummaryMaxDisplayCapacity]);

  return (
    <SettingSection
      title="Зерно"
      footer={
        !settings.enableBeanSummaryCapacityLimit
          ? 'Ограничивает показ остатка в кратком обзоре. Сверх лимита показывается как «1 кг+».'
          : !settings.enableBeanSummaryOverflowWrap
            ? 'С циклическим показом сверх лимита счёт начнётся с 0 (без «+»).'
            : undefined
      }
    >
      <SettingRow
        label="Максимум для показа"
        isLast={!settings.enableBeanSummaryCapacityLimit}
      >
        <SettingToggle
          checked={settings.enableBeanSummaryCapacityLimit || false}
          onChange={checked =>
            handleChange('enableBeanSummaryCapacityLimit', checked)
          }
        />
      </SettingRow>
      {settings.enableBeanSummaryCapacityLimit && (
        <>
          <SettingRow label="Циклический показ сверх лимита" isSubSetting>
            <SettingToggle
              checked={settings.enableBeanSummaryOverflowWrap || false}
              onChange={checked =>
                handleChange('enableBeanSummaryOverflowWrap', checked)
              }
            />
          </SettingRow>
          <SettingRow label="Лимит показа" isSubSetting isLast>
            <SettingPillInput
              value={capacityInput}
              inputMode="numeric"
              suffix="g"
              placeholder="Граммы"
              onChange={value => {
                const sanitizedValue = value.replace(/\D/g, '');
                setCapacityInput(sanitizedValue);
              }}
              onBlur={() => {
                void commitCapacityInput();
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void commitCapacityInput();
                }
              }}
            />
          </SettingRow>
        </>
      )}
    </SettingSection>
  );
};

export default BeanSummaryCapacityLimitSection;
