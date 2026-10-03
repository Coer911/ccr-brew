/**
 * 备份历史抽屉组件
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import type { BackupRecord } from '@/lib/s3/types';

interface BackupHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  backups: BackupRecord[];
  onRestore: (backupKey: string) => Promise<boolean>;
  isRestoring: boolean;
}

export const BackupHistoryDrawer: React.FC<BackupHistoryDrawerProps> = ({
  isOpen,
  onClose,
  backups,
  onRestore,
  isRestoring,
}) => {
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const canShowScrollShadows = isOpen && backups.length > 3;
  const isTopShadowVisible = canShowScrollShadows && showTopShadow;
  const isBottomShadowVisible = canShowScrollShadows && showBottomShadow;

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  // 检测滚动位置
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setShowTopShadow(scrollTop > 5);
    setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 5);
  }, []);

  // 列表变化时检测是否需要显示底部阴影
  useEffect(() => {
    if (!canShowScrollShadows) return;

    // 延迟检测，等待 DOM 更新
    const scrollTimer = setTimeout(handleScroll, 50);
    return () => clearTimeout(scrollTimer);
  }, [canShowScrollShadows, handleScroll]);

  const handleRestoreClick = (backupKey: string) => {
    setSelectedBackup(backupKey);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    const success = await onRestore(selectedBackup);
    if (success) {
      setSelectedBackup(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedBackup(null);
  };

  const handleClose = () => {
    setSelectedBackup(null);
    onClose();
  };

  return (
    <ActionDrawer isOpen={isOpen} onClose={handleClose}>
      <ActionDrawer.Switcher activeKey={selectedBackup ? 'confirm' : 'list'}>
        {selectedBackup ? (
          <>
            <ActionDrawer.Content>
              <p className="text-neutral-500 dark:text-neutral-400">
                Восстановить эту копию?
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                Текущие данные будут
                <span className="text-neutral-800 dark:text-neutral-200">
                  заменены
                </span>
              </p>
            </ActionDrawer.Content>
            <ActionDrawer.Actions>
              <ActionDrawer.SecondaryButton onClick={handleCancel}>
                Отмена
              </ActionDrawer.SecondaryButton>
              <ActionDrawer.PrimaryButton
                onClick={handleConfirmRestore}
                disabled={isRestoring}
              >
                {isRestoring ? 'Восстанавливаем...' : 'Восстановить'}
              </ActionDrawer.PrimaryButton>
            </ActionDrawer.Actions>
          </>
        ) : (
          <>
            <ActionDrawer.Content>
              <p className="text-neutral-800 dark:text-neutral-200">История копий</p>
              {backups.length === 0 ? (
                <p className="py-4 text-center text-neutral-500">
                  Копий пока нет
                </p>
              ) : (
                <div className="relative">
                  {/* 顶部渐变阴影 */}
                  <div
                    className={`fade-mask-to-b pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-white transition-opacity duration-200 dark:bg-neutral-900 ${isTopShadowVisible ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {/* 底部渐变阴影 */}
                  <div
                    className={`fade-mask-to-t pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-white transition-opacity duration-200 dark:bg-neutral-900 ${isBottomShadowVisible ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="max-h-44 space-y-2 overflow-y-auto"
                  >
                    {[...backups].reverse().map((backup, index) => (
                      <div
                        key={backup.key}
                        className="flex items-center justify-between rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800"
                      >
                        <div>
                          <div className="text-sm text-neutral-800 dark:text-neutral-200">
                            {formatDate(backup.timestamp)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {index === 0 ? 'Сначала новые' : `${index + 1} версий назад`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreClick(backup.key)}
                          disabled={isRestoring}
                          className="flex items-center gap-1 rounded-md bg-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-300 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Восстановить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-neutral-400">
                Перед каждой загрузкой делается копия, хранится до 5 последних версий
              </p>
            </ActionDrawer.Content>
            <ActionDrawer.Actions>
              <ActionDrawer.SecondaryButton onClick={handleClose}>
                Закрыть
              </ActionDrawer.SecondaryButton>
            </ActionDrawer.Actions>
          </>
        )}
      </ActionDrawer.Switcher>
    </ActionDrawer>
  );
};
