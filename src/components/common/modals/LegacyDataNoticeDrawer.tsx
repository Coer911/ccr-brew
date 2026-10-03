'use client';

import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import { DataManager } from '@/lib/core/dataManager';
import { exportDataAsJsonFile } from '@/lib/utils/dataExportUtils';
import DataAlertIcon from '@public/images/icons/ui/data-alert.svg';

interface LegacyDataNoticeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LegacyDataNoticeDrawer: React.FC<LegacyDataNoticeDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'success' | 'error' | null>(
    null
  );
  const [activeView, setActiveView] = useState<'notice' | 'developer-code'>(
    'notice'
  );

  const handleClose = useCallback(() => {
    setActiveView('notice');
    onClose();
  }, [onClose]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus(null);
    try {
      const jsonData = await DataManager.exportAllData({
        collectDiagnostics: true,
      });
      await exportDataAsJsonFile(jsonData);
      setExportStatus('success');
    } catch (error) {
      console.error('旧数据导出失败:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const developerButton = (
    <button
      type="button"
      onClick={() => setActiveView('developer-code')}
      className="inline cursor-pointer font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
      data-vaul-no-drag
    >
      разработчиком
    </button>
  );

  const noticeContent =
    exportStatus === 'success' ? (
      <>Данные выгружены, свяжитесь с{developerButton}.</>
    ) : exportStatus === 'error' ? (
      <>Не удалось выгрузить, попробуйте позже.</>
    ) : (
      <>
        Найдены
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          данные старой версии
        </span>
        . Чтобы не потерять их, приложение
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          не переносит их автоматически
        </span>
        . Выгрузите данные и свяжитесь с{developerButton}.
      </>
    );

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={handleClose}
      historyId="legacy-data-notice"
    >
      <ActionDrawer.Switcher activeKey={activeView}>
        {activeView === 'developer-code' ? (
          <>
            <ActionDrawer.Content className="flex flex-col items-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Напишите в поддержку Cultura Coffee и приложите выгруженный файл.
              </p>
            </ActionDrawer.Content>
            <ActionDrawer.Actions>
              <ActionDrawer.SecondaryButton
                onClick={() => setActiveView('notice')}
              >
                Назад
              </ActionDrawer.SecondaryButton>
            </ActionDrawer.Actions>
          </>
        ) : (
          <>
            <ActionDrawer.Icon icon={DataAlertIcon} />
            <ActionDrawer.Content>
              <p className="text-neutral-500 dark:text-neutral-400">
                {noticeContent}
              </p>
            </ActionDrawer.Content>
            <ActionDrawer.Actions>
              <ActionDrawer.SecondaryButton
                onClick={handleClose}
                disabled={isExporting}
              >
                Закрыть
              </ActionDrawer.SecondaryButton>
              <ActionDrawer.PrimaryButton
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Выгружаем' : 'Выгрузить данные'}
              </ActionDrawer.PrimaryButton>
            </ActionDrawer.Actions>
          </>
        )}
      </ActionDrawer.Switcher>
    </ActionDrawer>
  );
};

export default LegacyDataNoticeDrawer;
