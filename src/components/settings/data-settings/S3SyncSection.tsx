'use client';

/**
 * S3 同步配置组件
 *
 * 2025-12-21 重构：使用共享 Hook 和组件减少代码重复
 */

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { S3SyncManager } from '@/lib/s3/syncManagerV2';
import type {
  SyncResult,
  SyncMetadataV2 as SyncMetadata,
  BackupRecord,
} from '@/lib/s3/types';
import { useSyncSection } from '@/lib/hooks/useSyncSection';
import { SettingsOptions } from '../Settings';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import DataAlertIcon from '@public/images/icons/ui/data-alert.svg';
import { showToast } from '@/components/common/feedback/LightToast';
import {
  SyncHeaderButton,
  SyncDebugDrawer,
  SyncButtons,
  BackupHistoryDrawer,
} from './shared';

type S3SyncSettings = NonNullable<SettingsOptions['s3Sync']>;

interface S3SyncSectionProps {
  settings: S3SyncSettings;
  enabled: boolean;
  hapticFeedback: boolean;
  onSettingChange: <K extends keyof S3SyncSettings>(
    key: K,
    value: S3SyncSettings[K]
  ) => void;
  onSyncComplete?: () => void;
  onConflict?: (remoteTime: number | null) => void;
  onEnable?: () => void;
}

export const S3SyncSection: React.FC<S3SyncSectionProps> = ({
  settings,
  enabled,
  hapticFeedback,
  onSettingChange,
  onSyncComplete,
  onConflict,
  onEnable,
}) => {
  // ============================================
  // 使用共享 Hook
  // ============================================

  const {
    status,
    setStatus,
    error,
    setError,
    expanded,
    setExpanded,
    isSyncing,
    setIsSyncing,
    syncProgress,
    setSyncProgress,
    debugLogs,
    setDebugLogs,
    showDebugDrawer,
    setShowDebugDrawer,
    textAreaRef,
    copySuccess,
    handleCopyLogs,
    handleSelectAll,
    notifyCloudSyncStatusChange,
    triggerHaptic,
  } = useSyncSection(enabled, { hapticFeedback, onSyncComplete });

  // ============================================
  // S3 特有状态
  // ============================================

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [syncManager, setSyncManager] = useState<S3SyncManager | null>(null);
  const [showBackupDrawer, setShowBackupDrawer] = useState(false);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const isConfigComplete = Boolean(
    settings.accessKeyId && settings.secretAccessKey && settings.bucketName
  );
  const effectiveStatus: typeof status =
    !enabled || !isConfigComplete
      ? 'disconnected'
      : status === 'disconnected' && settings.lastConnectionSuccess
        ? 'connected'
        : status;
  const effectiveError = enabled ? error : '';
  const activeSyncManager = enabled && isConfigComplete ? syncManager : null;

  // ============================================
  // 自动连接
  // ============================================
  const getEffectiveStatusColor = () => {
    if (!enabled) return 'bg-neutral-300 dark:bg-neutral-600';
    switch (effectiveStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-neutral-300 dark:bg-neutral-600';
    }
  };

  const getEffectiveStatusText = () => {
    if (!enabled) return 'Нажмите, чтобы включить';
    switch (effectiveStatus) {
      case 'connected':
        return 'Подключено';
      case 'connecting':
        return 'Подключаемся...';
      case 'error':
        return 'Ошибка подключения';
      default:
        return 'Не настроено';
    }
  };

  // ============================================
  // 连接和同步操作
  // ============================================

  const testConnection = async () => {
    if (
      !settings.accessKeyId ||
      !settings.secretAccessKey ||
      !settings.bucketName
    ) {
      setError('Заполните все настройки S3');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError('');

    try {
      const manager = new S3SyncManager();
      const connected = await manager.initialize({
        region: settings.region,
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        bucketName: settings.bucketName,
        prefix: settings.prefix,
        endpoint: settings.endpoint || undefined,
      });

      if (connected) {
        setStatus('connected');
        setSyncManager(manager);
        onSettingChange('lastConnectionSuccess', true);
        notifyCloudSyncStatusChange();
        triggerHaptic('light');
      } else {
        setStatus('error');
        setError(
          manager.getLastError() ||
            (settings.endpoint
              ? 'Ошибка подключения: нет доступа к бакету или прав на запись'
              : 'Ошибка подключения: проверьте название бакета (Bucket) и регион (Region)')
        );
      }
    } catch (err) {
      setStatus('error');
      setError(`Ошибка подключения: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  const performSync = async (direction: 'upload' | 'download') => {
    if (isSyncing) {
      setError('Синхронизация уже идёт');
      return;
    }

    setIsSyncing(true);
    setError('');
    setSyncProgress(null);

    try {
      // 按需建立连接（已验证过的连接跳过测试）
      let manager = activeSyncManager;
      if (!manager || !manager.isInitialized()) {
        manager = new S3SyncManager();
        const skipTest = settings.lastConnectionSuccess === true;
        const connected = await manager.initialize(
          {
            region: settings.region,
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
            bucketName: settings.bucketName,
            prefix: settings.prefix,
            endpoint: settings.endpoint || undefined,
          },
          skipTest
        );
        if (!connected) {
          setStatus('error');
          setError(manager.getLastError() || 'Ошибка подключения, проверьте настройки');
          setIsSyncing(false);
          return;
        }
        setSyncManager(manager);
        setStatus('connected');
        onSettingChange('lastConnectionSuccess', true);
      }

      const result: SyncResult = await manager.sync({
        preferredDirection: direction,
        onProgress: progress => {
          setSyncProgress({
            phase: progress.phase,
            message: progress.message,
            percentage: progress.percentage,
          });
        },
      });

      if (result.conflict) {
        const metadata = result.remoteMetadata;
        if (metadata && 'version' in metadata && metadata.version === '2.0.0') {
          onConflict?.((metadata as SyncMetadata).lastSyncTime || null);
        }
        if (result.debugLogs && result.debugLogs.length > 0) {
          setDebugLogs(result.debugLogs);
          setShowDebugDrawer(true);
        }
        setError('Конфликт данных: изменились и локальные, и облачные данные.');
        return;
      }

      if (result.success) {
        if (result.downloadedFiles > 0) {
          triggerHaptic('medium');
          onSyncComplete?.();
          window.location.reload();
          return;
        }

        if (result.uploadedFiles > 0) {
          showToast({
            type: 'success',
            title: `Загружено: ${result.uploadedFiles} шт. в облако`,
            duration: 2500,
          });
        } else {
          if (result.debugLogs && result.debugLogs.length > 0) {
            setDebugLogs(result.debugLogs);
            setShowDebugDrawer(true);
            showToast({
              type: 'warning',
              title: `${direction === 'upload' ? 'Загрузить в облако' : 'Скачать из облака'} завершено, но файлы не переданы — посмотрите подробный журнал`,
              duration: 3000,
            });
          } else {
            showToast({
              type: 'info',
              title: 'Данные актуальны, синхронизация не нужна',
              duration: 2000,
            });
          }
        }

        triggerHaptic('medium');
        onSyncComplete?.();
      } else {
        if (result.debugLogs && result.debugLogs.length > 0) {
          setDebugLogs(result.debugLogs);
          setShowDebugDrawer(true);
        }
        setError(result.message || 'Ошибка синхронизации');
        showToast({
          type: 'error',
          title: result.message || 'Ошибка синхронизации',
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('同步失败:', err);
      setError(`Ошибка синхронизации: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      showToast({
        type: 'error',
        title: `Ошибка синхронизации: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`,
        duration: 3000,
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleShowBackups = async () => {
    setIsLoadingBackups(true);
    try {
      let manager = activeSyncManager;
      if (!manager || !manager.isInitialized()) {
        manager = new S3SyncManager();
        const connected = await manager.initialize(
          {
            region: settings.region,
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
            bucketName: settings.bucketName,
            prefix: settings.prefix,
            endpoint: settings.endpoint || undefined,
          },
          true
        );
        if (!connected) {
          showToast({ type: 'error', title: 'Ошибка подключения', duration: 2000 });
          return;
        }
        setSyncManager(manager);
      }

      const list = await manager.listBackups();
      setBackups(list);
      setShowBackupDrawer(true);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleRestoreBackup = async (backupKey: string): Promise<boolean> => {
    if (!activeSyncManager) return false;
    setIsRestoring(true);
    try {
      const success = await activeSyncManager.restoreFromBackup(backupKey);
      if (success) {
        showToast({
          type: 'success',
          title: 'Восстановлено, перезапускаем...',
          duration: 2000,
        });
        setTimeout(() => window.location.reload(), 2000);
        return true;
      } else {
        showToast({ type: 'error', title: 'Не удалось восстановить', duration: 2000 });
        return false;
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // ============================================
  // UI 渲染
  // ============================================

  return (
    <div className="ml-0 space-y-3">
      {/* 头部按钮 */}
      <SyncHeaderButton
        serviceName="S3"
        enabled={enabled}
        status={effectiveStatus}
        expanded={expanded}
        statusColor={getEffectiveStatusColor()}
        statusText={getEffectiveStatusText()}
        onClick={() => {
          if (!enabled && onEnable) {
            onEnable();
          }
          setExpanded(!expanded);
        }}
      />

      {/* 配置表单 */}
      {enabled && expanded && (
        <div className="space-y-3 rounded bg-neutral-100 p-4 dark:bg-neutral-800">
          {/* 服务地址 (Endpoint) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Адрес сервиса (Endpoint)
            </label>
            <input
              type="url"
              value={settings.endpoint || ''}
              onChange={e => onSettingChange('endpoint', e.target.value)}
              placeholder="s3.cstcloud.cn"
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* 区域 (Region) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Регион (Region)
            </label>
            <input
              type="text"
              value={settings.region}
              onChange={e => onSettingChange('region', e.target.value)}
              placeholder="us-east-1"
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* Access Key ID */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Access Key ID
            </label>
            <input
              type="text"
              value={settings.accessKeyId}
              onChange={e => onSettingChange('accessKeyId', e.target.value)}
              placeholder="AKIA..."
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* Secret Access Key */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Secret Access Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={settings.secretAccessKey}
                onChange={e =>
                  onSettingChange('secretAccessKey', e.target.value)
                }
                placeholder="Ключ"
                className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute top-1/2 right-2 -translate-y-1/2 transform p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 存储桶 (Bucket) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Бакет (Bucket)
            </label>
            <input
              type="text"
              value={settings.bucketName}
              onChange={e => onSettingChange('bucketName', e.target.value)}
              placeholder="bucket-name"
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* 文件前缀 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Префикс файлов (необязательно)
            </label>
            <input
              type="text"
              value={settings.prefix}
              onChange={e => onSettingChange('prefix', e.target.value)}
              placeholder="brew-guide-data/"
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* 错误信息 */}
          {effectiveError && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {effectiveError}
            </div>
          )}

          {/* 测试连接按钮 */}
          <button
            type="button"
            onClick={testConnection}
            disabled={effectiveStatus === 'connecting'}
            className="w-full rounded-md bg-neutral-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-900 disabled:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {effectiveStatus === 'connecting' ? 'Подключаемся...' : 'Проверить подключение'}
          </button>
        </div>
      )}

      {/* 同步按钮 */}
      <SyncButtons
        enabled={enabled}
        isConnected={effectiveStatus === 'connected'}
        isSyncing={isSyncing}
        onUpload={() => performSync('upload')}
        onDownload={() => performSync('download')}
        onShowBackups={handleShowBackups}
        isLoadingBackups={isLoadingBackups}
      />

      {/* 备份历史抽屉 */}
      <BackupHistoryDrawer
        isOpen={showBackupDrawer}
        onClose={() => setShowBackupDrawer(false)}
        backups={backups}
        onRestore={handleRestoreBackup}
        isRestoring={isRestoring}
      />

      {/* 调试日志抽屉 */}
      <SyncDebugDrawer
        isOpen={showDebugDrawer}
        onClose={() => setShowDebugDrawer(false)}
        logs={debugLogs}
        textAreaRef={textAreaRef}
        copySuccess={copySuccess}
        onCopy={handleCopyLogs}
        onSelectAll={handleSelectAll}
        title="Журнал синхронизации S3"
      />
    </div>
  );
};
