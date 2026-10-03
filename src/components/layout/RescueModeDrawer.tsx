'use client';

import React, { useEffect, useReducer } from 'react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import { showToast } from '@/components/common/feedback/LightToast';
import {
  exportRescueData,
  RESCUE_MODE_OPEN_EVENT,
} from '@/lib/rescue/rescueMode';

interface RescueModeDrawerState {
  isOpen: boolean;
  isExporting: boolean;
  isExportingLegacyPreferences: boolean;
  isRecompressing: boolean;
}

type RescueModeDrawerAction =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'exportStarted' }
  | { type: 'exportSucceeded' }
  | { type: 'exportFailed' }
  | { type: 'legacyPreferencesExportStarted' }
  | { type: 'legacyPreferencesExportSucceeded' }
  | { type: 'legacyPreferencesExportFailed' }
  | { type: 'recompressStarted' }
  | { type: 'recompressSucceeded' }
  | { type: 'recompressFailed' };

const initialState: RescueModeDrawerState = {
  isOpen: false,
  isExporting: false,
  isExportingLegacyPreferences: false,
  isRecompressing: false,
};

const rescueModeDrawerReducer = (
  state: RescueModeDrawerState,
  action: RescueModeDrawerAction
): RescueModeDrawerState => {
  switch (action.type) {
    case 'open':
      return { ...state, isOpen: true };
    case 'close':
      return { ...state, isOpen: false };
    case 'exportStarted':
      return { ...state, isExporting: true };
    case 'exportSucceeded':
      return {
        ...state,
        isExporting: false,
      };
    case 'exportFailed':
      return { ...state, isExporting: false };
    case 'legacyPreferencesExportStarted':
      return {
        ...state,
        isExportingLegacyPreferences: true,
      };
    case 'legacyPreferencesExportSucceeded':
      return {
        ...state,
        isExportingLegacyPreferences: false,
      };
    case 'legacyPreferencesExportFailed':
      return { ...state, isExportingLegacyPreferences: false };
    case 'recompressStarted':
      return {
        ...state,
        isRecompressing: true,
      };
    case 'recompressSucceeded':
      return {
        ...state,
        isRecompressing: false,
      };
    case 'recompressFailed':
      return { ...state, isRecompressing: false };
  }
};

const RescueModeDrawer: React.FC = () => {
  const [state, dispatch] = useReducer(rescueModeDrawerReducer, initialState);
  const { isOpen, isExporting, isExportingLegacyPreferences, isRecompressing } =
    state;

  useEffect(() => {
    const open = () => {
      dispatch({ type: 'open' });
    };

    window.addEventListener(RESCUE_MODE_OPEN_EVENT, open);
    return () => window.removeEventListener(RESCUE_MODE_OPEN_EVENT, open);
  }, []);

  const handleExport = async (includeImages: boolean) => {
    if (isExporting || isExportingLegacyPreferences || isRecompressing) return;

    dispatch({ type: 'exportStarted' });
    try {
      const [{ exportJsonFile }, jsonData] = await Promise.all([
        import('@/lib/utils/jsonExport'),
        includeImages
          ? import('@/lib/core/dataManager').then(({ DataManager }) =>
              DataManager.exportAllData({ collectDiagnostics: true })
            )
          : exportRescueData(),
      ]);
      const date = new Date().toISOString().slice(0, 10);
      await exportJsonFile({
        jsonData,
        fileName: includeImages
          ? `brew-guide-rescue-${date}.json`
          : `brew-guide-rescue-no-images-${date}.json`,
        title: 'Выгрузить данные для восстановления',
        text: 'Выберите, куда сохранить',
        dialogTitle: 'Выгрузить данные для восстановления',
      });
      dispatch({ type: 'exportSucceeded' });
      showToast({ type: 'success', title: 'Данные выгружены' });
    } catch (error) {
      console.error('抢救导出失败:', error);
      dispatch({ type: 'exportFailed' });
      showToast({ type: 'error', title: 'Ошибка выгрузки' });
    }
  };

  const handleRecompressImages = async () => {
    if (isRecompressing || isExporting || isExportingLegacyPreferences) return;

    dispatch({ type: 'recompressStarted' });
    try {
      const { recompressOversizedAppImages } =
        await import('@/lib/images/recompressAppImages');
      const stats = await recompressOversizedAppImages();

      dispatch({ type: 'recompressSucceeded' });
      showToast({
        type: stats.failedCount > 0 ? 'warning' : 'success',
        title:
          stats.failedCount > 0
            ? `Досжатие готово, ${stats.failedCount} не удалось`
            : stats.compressedCount > 0
              ? `Досжато: ${stats.compressedCount} фото`
              : 'Нет фото для досжатия',
      });
    } catch (error) {
      console.error('图片补压失败:', error);
      dispatch({ type: 'recompressFailed' });
      showToast({ type: 'error', title: 'Не удалось досжать фото' });
    }
  };

  const handleExportLegacyPreferences = async () => {
    if (isExportingLegacyPreferences || isExporting || isRecompressing) return;

    dispatch({ type: 'legacyPreferencesExportStarted' });
    try {
      const [{ exportJsonFile }, { exportLegacyPreferencesRescueData }] =
        await Promise.all([
          import('@/lib/utils/jsonExport'),
          import('@/lib/rescue/legacyPreferencesRescue'),
        ]);
      const jsonData = await exportLegacyPreferencesRescueData();
      const date = new Date().toISOString().slice(0, 10);

      await exportJsonFile({
        jsonData,
        fileName: `brew-guide-legacy-preferences-rescue-${date}.json`,
        title: 'Выгрузить данные старого хранилища',
        text: 'Выберите, куда сохранить',
        dialogTitle: 'Выгрузить данные старого хранилища',
      });
      dispatch({ type: 'legacyPreferencesExportSucceeded' });
      showToast({ type: 'success', title: 'Данные старого хранилища выгружены' });
    } catch (error) {
      console.error('旧版存储数据导出失败:', error);
      dispatch({ type: 'legacyPreferencesExportFailed' });
      showToast({ type: 'error', title: 'Не удалось выгрузить старое хранилище' });
    }
  };

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={() => dispatch({ type: 'close' })}
      historyId="rescue-mode"
    >
      <ActionDrawer.Content className="mb-6!">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Режим восстановления
        </p>
      </ActionDrawer.Content>
      <ActionDrawer.Actions className="flex-col [&>button]:w-full [&>button]:flex-none [&>button]:text-left">
        <ActionDrawer.SecondaryButton
          onClick={() => handleExport(true)}
          disabled={
            isExporting || isExportingLegacyPreferences || isRecompressing
          }
        >
          {isExporting ? 'Выгружаем' : 'Выгрузить данные'}
        </ActionDrawer.SecondaryButton>
        <ActionDrawer.SecondaryButton
          onClick={() => handleExport(false)}
          disabled={
            isExporting || isExportingLegacyPreferences || isRecompressing
          }
        >
          Выгрузить данные (без фото)
        </ActionDrawer.SecondaryButton>
        <ActionDrawer.SecondaryButton
          onClick={handleExportLegacyPreferences}
          disabled={
            isExporting || isExportingLegacyPreferences || isRecompressing
          }
        >
          {isExportingLegacyPreferences
            ? 'Выгружаем старое хранилище'
            : 'Выгрузить данные старого хранилища'}
        </ActionDrawer.SecondaryButton>
        <ActionDrawer.SecondaryButton
          onClick={handleRecompressImages}
          disabled={
            isRecompressing || isExporting || isExportingLegacyPreferences
          }
        >
          {isRecompressing ? 'Сжимаем' : 'Сжать фото'}
        </ActionDrawer.SecondaryButton>
        <ActionDrawer.SecondaryButton
          onClick={() => dispatch({ type: 'close' })}
        >
          Закрыть
        </ActionDrawer.SecondaryButton>
      </ActionDrawer.Actions>
    </ActionDrawer>
  );
};

export default RescueModeDrawer;
