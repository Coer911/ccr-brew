'use client';

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { type CustomEquipment, type Method } from '@/lib/core/config';
import { showToast } from '@/components/common/feedback/LightToast';

export interface EquipmentImportFilePickerHandle {
  open: () => void;
}

interface EquipmentImportFilePickerProps {
  onImport: (equipment: CustomEquipment, methods?: Method[]) => void;
  existingEquipments?: CustomEquipment[];
}

const buildImportedEquipment = (
  equipment: CustomEquipment
): CustomEquipment => ({
  id:
    equipment.id ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  name: equipment.name,
  isCustom: true,
  animationType: equipment.animationType,
  hasValve: equipment.hasValve || false,
  customShapeSvg: equipment.customShapeSvg,
  customValveSvg: equipment.customValveSvg,
  customValveOpenSvg: equipment.customValveOpenSvg,
  customPourAnimations: equipment.customPourAnimations || [],
});

const buildImportedMethods = (methods?: Method[]) =>
  Array.isArray(methods)
    ? methods.map(method => ({
        ...method,
        id:
          method.id ||
          `method-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      }))
    : undefined;

const EquipmentImportFilePicker = forwardRef<
  EquipmentImportFilePickerHandle,
  EquipmentImportFilePickerProps
>(({ onImport, existingEquipments = [] }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const processImportData = useCallback(
    async (jsonText: string) => {
      setIsImporting(true);

      try {
        const { extractJsonFromText } = await import('@/lib/utils/jsonUtils');
        const data = extractJsonFromText(jsonText);

        if (!data) {
          throw new Error('Неверный формат данных для импорта');
        }

        const exportData = data as {
          equipment?: CustomEquipment;
          methods?: Method[];
        };

        if (!exportData.equipment) {
          throw new Error('Неверный файл экспорта устройства: нет поля equipment');
        }

        const existingEquipment = existingEquipments.find(
          equipment => equipment.name === exportData.equipment?.name
        );

        if (existingEquipment) {
          throw new Error(
            `Устройство «${exportData.equipment.name}» уже есть, переименуйте и импортируйте снова`
          );
        }

        onImport(
          buildImportedEquipment(exportData.equipment),
          buildImportedMethods(exportData.methods)
        );

        showToast({
          type: 'success',
          title: 'Устройство импортировано',
          duration: 2000,
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: (error as Error).message || 'Ошибка импорта',
          duration: 3000,
        });
      } finally {
        setIsImporting(false);
      }
    },
    [existingEquipments, onImport]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showToast({
          type: 'error',
          title: 'Выберите JSON-файл',
          duration: 3000,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = event => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          void processImportData(text);
          return;
        }

        showToast({
          type: 'error',
          title: 'Не удалось прочитать файл, попробуйте ещё раз',
          duration: 3000,
        });
      };
      reader.onerror = () => {
        setIsImporting(false);
        showToast({
          type: 'error',
          title: 'Не удалось прочитать файл, попробуйте ещё раз',
          duration: 3000,
        });
      };
      reader.readAsText(file);
    },
    [processImportData]
  );

  const handleNativeFilePicker = useCallback(async () => {
    try {
      setIsImporting(true);

      const result = await FilePicker.pickFiles({
        types: ['application/json'],
      });

      const file = result.files[0];
      if (!file) {
        setIsImporting(false);
        return;
      }

      if (!file.path) {
        throw new Error('Не удаётся прочитать файл');
      }

      const response = await fetch(file.path);
      const text = await response.text();
      await processImportData(text);
    } catch (error) {
      showToast({
        type: 'error',
        title: (error as Error).message || 'Не удалось выбрать файл, попробуйте ещё раз',
        duration: 3000,
      });
      setIsImporting(false);
    }
  }, [processImportData]);

  const open = useCallback(() => {
    if (isImporting) return;

    if (isNative) {
      void handleNativeFilePicker();
      return;
    }

    fileInputRef.current?.click();
  }, [handleNativeFilePicker, isImporting, isNative]);

  useImperativeHandle(ref, () => ({ open }), [open]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept=".json,application/json"
      onChange={handleFileChange}
      className="hidden"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
});

EquipmentImportFilePicker.displayName = 'EquipmentImportFilePicker';

export default EquipmentImportFilePicker;
