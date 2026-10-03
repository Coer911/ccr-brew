import React from 'react';
import { BlendComponent } from '@/types/app';
import AutocompleteInput from '@/components/common/forms/AutocompleteInput';
import { useBlendComponentSuggestions } from '../hooks/useBlendComponentSuggestions';
import { usePresetSuggestions } from '../hooks/usePresetSuggestions';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import {
  getComponentFieldValue,
  getEnabledBeanFieldIds,
  resolveBeanFieldConfig,
  type BeanFieldId,
} from '@/lib/coffee-beans/beanFields';
import type { BlendPresetKey } from '../constants';

type TextBlendField = Exclude<keyof BlendComponent, 'percentage'>;

interface BlendComponentFieldRowsProps {
  component: BlendComponent;
  index: number;
  showEstateField: boolean;
  onChange: (index: number, field: TextBlendField, value: string) => void;
}

const fieldConfigs: Array<{
  field: TextBlendField;
  label: string;
  placeholder: string;
  suggestionKey?: BlendPresetKey;
}> = [
  {
    field: 'origin',
    label: 'Происхождение',
    placeholder: 'Происхождение',
    suggestionKey: 'origins',
  },
  {
    field: 'country',
    label: 'Страна',
    placeholder: 'Страна',
    suggestionKey: 'countries',
  },
  {
    field: 'region',
    label: 'Регион',
    placeholder: 'Регион',
    suggestionKey: 'regions',
  },
  {
    field: 'estate',
    label: 'Ферма',
    placeholder: 'Ферма',
    suggestionKey: 'estates',
  },
  {
    field: 'processingStation',
    label: 'Станция обработки',
    placeholder: 'Станция обработки',
    suggestionKey: 'processingStations',
  },
  {
    field: 'altitude',
    label: 'Высота',
    placeholder: 'Высота',
    suggestionKey: 'altitudes',
  },
  {
    field: 'process',
    label: 'Обработка',
    placeholder: 'Обработка',
    suggestionKey: 'processes',
  },
  {
    field: 'batch',
    label: 'Партия',
    placeholder: 'Партия',
    suggestionKey: 'batches',
  },
  {
    field: 'variety',
    label: 'Разновидность',
    placeholder: 'Разновидность',
    suggestionKey: 'varieties',
  },
];

interface BlendComponentFieldInputProps {
  config: (typeof fieldConfigs)[number];
  component: BlendComponent;
  index: number;
  suggestions: ReturnType<typeof useBlendComponentSuggestions>;
  onChange: (index: number, field: TextBlendField, value: string) => void;
}

const BlendComponentFieldInput: React.FC<BlendComponentFieldInputProps> = ({
  config,
  component,
  index,
  suggestions,
  onChange,
}) => {
  const presetSuggestions = usePresetSuggestions(
    config.suggestionKey || 'origins',
    config.suggestionKey ? suggestions[config.suggestionKey] : []
  );

  return (
    <AutocompleteInput
      label={config.label}
      value={getComponentFieldValue(component, config.field as BeanFieldId)}
      onChange={value => onChange(index, config.field, value)}
      placeholder={config.placeholder}
      suggestions={presetSuggestions.suggestions}
      clearable
      isCustomPreset={presetSuggestions.isRemovableSuggestion}
      onRemovePreset={presetSuggestions.removeSuggestion}
    />
  );
};

const BlendComponentFieldRows: React.FC<BlendComponentFieldRowsProps> = ({
  component,
  index,
  showEstateField,
  onChange,
}) => {
  const suggestions = useBlendComponentSuggestions();
  const settings = useSettingsStore(state => state.settings);
  const enabledFieldIds = getEnabledBeanFieldIds(
    resolveBeanFieldConfig(settings)
  );
  const visibleFieldIds = new Set<BeanFieldId>(enabledFieldIds);

  fieldConfigs.forEach(config => {
    if (getComponentFieldValue(component, config.field as BeanFieldId)) {
      visibleFieldIds.add(config.field as BeanFieldId);
    }
  });

  if (showEstateField) {
    visibleFieldIds.add('estate');
  }

  const visibleFields = fieldConfigs.filter(config =>
    visibleFieldIds.has(config.field as BeanFieldId)
  );
  const gridColumns =
    visibleFields.length <= 2 || visibleFields.length === 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div className={`grid gap-3 ${gridColumns}`}>
      {visibleFields.map(config => (
        <BlendComponentFieldInput
          key={config.field}
          config={config}
          component={component}
          index={index}
          suggestions={suggestions}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

export default BlendComponentFieldRows;
