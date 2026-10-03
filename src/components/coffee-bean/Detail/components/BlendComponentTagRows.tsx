'use client';

import React from 'react';
import { BlendComponent } from '@/types/app';
import { useBlendComponentSuggestions } from '@/components/coffee-bean/Form/hooks/useBlendComponentSuggestions';
import { usePresetSuggestions } from '@/components/coffee-bean/Form/hooks/usePresetSuggestions';
import TagAutocompleteInput from './TagAutocompleteInput';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import {
  getComponentFieldValue,
  getEnabledBeanFieldIds,
  resolveBeanFieldConfig,
  type BeanFieldId,
} from '@/lib/coffee-beans/beanFields';
import type { BlendPresetKey } from '@/components/coffee-bean/Form/constants';

type TextBlendField = Exclude<keyof BlendComponent, 'percentage'>;

interface BlendComponentTagRowsProps {
  components: BlendComponent[];
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
    placeholder: 'Регион происхождения, через запятую',
    suggestionKey: 'origins',
  },
  {
    field: 'country',
    label: 'Страна',
    placeholder: 'Страна, через запятую',
    suggestionKey: 'countries',
  },
  {
    field: 'region',
    label: 'Регион',
    placeholder: 'Регион, через запятую',
    suggestionKey: 'regions',
  },
  {
    field: 'estate',
    label: 'Ферма',
    placeholder: 'Ферма, через запятую',
    suggestionKey: 'estates',
  },
  {
    field: 'processingStation',
    label: 'Станция обработки',
    placeholder: 'Станция обработки, через запятую',
    suggestionKey: 'processingStations',
  },
  {
    field: 'altitude',
    label: 'Высота',
    placeholder: 'Высота, через запятую',
    suggestionKey: 'altitudes',
  },
  {
    field: 'process',
    label: 'Обработка',
    placeholder: 'Обработка, через запятую',
    suggestionKey: 'processes',
  },
  {
    field: 'batch',
    label: 'Партия',
    placeholder: 'Партия, через запятую',
    suggestionKey: 'batches',
  },
  {
    field: 'variety',
    label: 'Разновидность',
    placeholder: 'Разновидность, через запятую',
    suggestionKey: 'varieties',
  },
];

const getAppendIndex = (
  components: BlendComponent[],
  field: TextBlendField
) => {
  const emptyIndex = components.findIndex(
    component => !String(component[field] || '').trim()
  );

  return emptyIndex === -1 ? components.length : emptyIndex;
};

const getFieldEntries = (components: BlendComponent[], field: TextBlendField) =>
  components
    .map((component, index) => ({
      index,
      value: String(component[field] || '').trim(),
    }))
    .filter(entry => entry.value);

interface BlendComponentTagFieldProps {
  config: (typeof fieldConfigs)[number];
  components: BlendComponent[];
  suggestions: ReturnType<typeof useBlendComponentSuggestions>;
  onChange: (index: number, field: TextBlendField, value: string) => void;
}

const BlendComponentTagField: React.FC<BlendComponentTagFieldProps> = ({
  config,
  components,
  suggestions,
  onChange,
}) => {
  const entries = getFieldEntries(components, config.field);
  const placeholder = entries.length === 0 ? config.placeholder : '+ ';
  const presetSuggestions = usePresetSuggestions(
    config.suggestionKey || 'origins',
    config.suggestionKey ? suggestions[config.suggestionKey] : []
  );

  return (
    <div className="flex items-start">
      <div className="w-16 shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {config.label}
      </div>
      <div className="-mt-0.5 flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {entries.map(entry => (
          <span
            key={`${config.field}-${entry.index}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={event => {
              const nextValue = event.currentTarget.textContent?.trim() || '';

              if (nextValue !== entry.value) {
                onChange(entry.index, config.field, nextValue);
              }
            }}
            className="cursor-text bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-700 outline-none dark:bg-neutral-800/40 dark:text-neutral-300"
          >
            {entry.value}
          </span>
        ))}

        <TagAutocompleteInput
          placeholder={placeholder}
          suggestions={presetSuggestions.suggestions.filter(
            suggestion => !entries.some(entry => entry.value === suggestion)
          )}
          isCustomPreset={presetSuggestions.isRemovableSuggestion}
          onRemovePreset={presetSuggestions.removeSuggestion}
          onCommit={value =>
            onChange(
              getAppendIndex(components, config.field),
              config.field,
              value
            )
          }
          onBackspaceEmpty={() => {
            if (!entries.length) return undefined;

            const lastEntry = entries[entries.length - 1];
            onChange(lastEntry.index, config.field, '');
            return lastEntry.value;
          }}
        />
      </div>
    </div>
  );
};

const BlendComponentTagRows: React.FC<BlendComponentTagRowsProps> = ({
  components,
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
    if (
      components.some(component =>
        getComponentFieldValue(component, config.field as BeanFieldId)
      )
    ) {
      visibleFieldIds.add(config.field as BeanFieldId);
    }
  });

  if (showEstateField) {
    visibleFieldIds.add('estate');
  }

  const visibleFields = fieldConfigs.filter(config =>
    visibleFieldIds.has(config.field as BeanFieldId)
  );

  return (
    <div className="space-y-3">
      {visibleFields.map(config => (
        <BlendComponentTagField
          key={config.field}
          config={config}
          components={components}
          suggestions={suggestions}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

export default BlendComponentTagRows;
