'use client';

import {
  TempFileManager,
  type JsonFileSaveMode,
} from '@/lib/utils/tempFileManager';

export type JsonExportMode = JsonFileSaveMode;

export interface JsonExportResult {
  mode: JsonExportMode;
  fileName: string;
}

export interface JsonExportOptions {
  jsonData: string;
  fileName: string;
  title?: string;
  text?: string;
  dialogTitle?: string;
  returnIncompleteResult?: boolean;
}

const JSON_EXTENSION = '.json';

const ensureJsonFileName = (fileName: string): string => {
  const trimmedFileName = fileName.trim();

  if (!trimmedFileName) {
    throw new Error('Имя файла экспорта не может быть пустым');
  }

  return trimmedFileName.endsWith(JSON_EXTENSION)
    ? trimmedFileName
    : `${trimmedFileName}${JSON_EXTENSION}`;
};

export async function exportJsonFile({
  jsonData,
  fileName,
  title = 'Выгрузить данные',
  text = 'Выберите, куда сохранить',
  dialogTitle = 'Выгрузить данные',
  returnIncompleteResult = false,
}: JsonExportOptions): Promise<JsonExportResult> {
  const normalizedFileName = ensureJsonFileName(fileName);
  const mode = await TempFileManager.saveJsonFile(jsonData, normalizedFileName, {
    title,
    text,
    dialogTitle,
  });

  if (!returnIncompleteResult && mode === 'activation-required') {
    throw new Error('Чтобы поделиться, нажмите ещё раз');
  }

  if (!returnIncompleteResult && mode === 'cancelled') {
    throw new Error('Отправка отменена');
  }

  return {
    mode,
    fileName: normalizedFileName,
  };
}
