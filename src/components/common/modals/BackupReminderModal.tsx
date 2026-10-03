'use client';

import React, { useState, useCallback } from 'react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import {
  BackupReminderUtils,
  BackupReminderType,
} from '@/lib/utils/backupReminderUtils';
import { DataManager as DataManagerUtil } from '@/lib/core/dataManager';
import { exportDataAsJsonFile } from '@/lib/utils/dataExportUtils';
import BackupRestoreIcon from '@public/images/icons/ui/backup-restore.svg';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderType?: BackupReminderType | null;
}

const BackupReminderModal: React.FC<BackupReminderModalProps> = ({
  isOpen,
  onClose,
  reminderType = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'exporting' | 'success' | 'error'
  >('idle');
  const [exportMessage, setExportMessage] = useState('');

  const handleBackupNow = useCallback(async () => {
    setIsLoading(true);
    setExportStatus('exporting');
    setExportMessage('Делаем резервную копию…');

    try {
      const jsonData = await DataManagerUtil.exportAllData();
      const exportResult = await exportDataAsJsonFile(jsonData);

      if (exportResult.mode === 'native-share') {
        setExportMessage('Резервная копия готова.');
      } else if (exportResult.mode === 'android-document') {
        setExportMessage('Резервная копия готова, файл сохранён.');
      } else {
        setExportMessage('Резервная копия готова.');
      }

      // 标记备份完成
      await BackupReminderUtils.markBackupCompleted();

      setExportStatus('success');
    } catch (error) {
      console.error('导出失败:', error);
      setExportStatus('error');
      setExportMessage('Не удалось сделать копию, попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRemindLater = useCallback(async () => {
    setIsLoading(true);
    try {
      await BackupReminderUtils.markReminderShown();
      onClose();
    } catch (error) {
      console.error('设置提醒失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onClose]);

  const getReminderMessage = () => {
    switch (reminderType) {
      case 'hasDataNeverBackedUp':
        return 'У вас накопилось немало заварок и зерна — сделайте резервную копию, так спокойнее.';
      case 'firstTimeAfterDays':
        return 'С резервными копиями ваши кофейные данные сохранятся при смене телефона или переустановке.';
      case 'periodicReminder':
        return 'С прошлой копии прошло немало времени, давайте сделаем новую.';
      default:
        return 'Регулярные копии — и ваши кофейные данные в безопасности.';
    }
  };

  const message = exportMessage || getReminderMessage();
  const primaryText =
    exportStatus === 'exporting'
      ? 'Копируем…'
      : exportStatus === 'success'
        ? 'Хорошо'
        : exportStatus === 'error'
          ? 'Ещё раз'
          : 'Сделать копию';
  const handlePrimaryClick = useCallback(() => {
    if (exportStatus === 'success') {
      onClose();
      return;
    }

    void handleBackupNow();
  }, [exportStatus, handleBackupNow, onClose]);

  return (
    <ActionDrawer isOpen={isOpen} onClose={onClose} historyId="backup-reminder">
      <ActionDrawer.Icon icon={BackupRestoreIcon} />
      <ActionDrawer.Content>
        <p className="text-neutral-500 dark:text-neutral-400">{message}</p>
      </ActionDrawer.Content>
      <ActionDrawer.Actions>
        {exportStatus !== 'success' && (
          <ActionDrawer.SecondaryButton
            onClick={handleRemindLater}
            disabled={isLoading}
          >
            Потом
          </ActionDrawer.SecondaryButton>
        )}
        <ActionDrawer.PrimaryButton
          onClick={handlePrimaryClick}
          disabled={isLoading && exportStatus !== 'success'}
        >
          {primaryText}
        </ActionDrawer.PrimaryButton>
      </ActionDrawer.Actions>
    </ActionDrawer>
  );
};

export default BackupReminderModal;
