'use client';

/**
 * WebDAV 同步配置组件
 *
 * 2025-12-21 重构：使用共享 Hook 和组件减少代码重复
 */

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { WebDAVSyncManager } from '@/lib/webdav/syncManager';
import type { SyncResult as WebDAVSyncResult } from '@/lib/webdav/types';
import type { BackupRecord } from '@/lib/s3/types';
import { useSyncSection } from '@/lib/hooks/useSyncSection';
import { SettingsOptions } from '../Settings';
import WebDAVTutorialModal from './WebDAVTutorialModal';
import { showToast } from '@/components/common/feedback/LightToast';
import {
  SyncHeaderButton,
  SyncDebugDrawer,
  SyncButtons,
  BackupHistoryDrawer,
} from './shared';

type WebDAVSyncSettings = NonNullable<SettingsOptions['webdavSync']>;

interface WebDAVSyncSectionProps {
  settings: WebDAVSyncSettings;
  enabled: boolean;
  hapticFeedback: boolean;
  onSettingChange: <K extends keyof WebDAVSyncSettings>(
    key: K,
    value: WebDAVSyncSettings[K]
  ) => void;
  onSyncComplete?: () => void;
  onEnable?: () => void;
}

export const WebDAVSyncSection: React.FC<WebDAVSyncSectionProps> = ({
  settings,
  enabled,
  hapticFeedback,
  onSettingChange,
  onSyncComplete,
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
  // WebDAV 特有状态
  // ============================================

  const [showPassword, setShowPassword] = useState(false);
  const [syncManager, setSyncManager] = useState<WebDAVSyncManager | null>(
    null
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBackupDrawer, setShowBackupDrawer] = useState(false);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const isConfigComplete = Boolean(
    settings.url && settings.username && settings.password
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
  // 状态初始化（不自动连接，连接在用户操作时按需建立）
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
  // 教程完成回调
  // ============================================

  const handleTutorialComplete = async (config: {
    url: string;
    username: string;
    password: string;
  }) => {
    onSettingChange('url', config.url);
    onSettingChange('username', config.username);
    onSettingChange('password', config.password);
    onSettingChange('lastConnectionSuccess', true);

    setExpanded(true);
    setStatus('connected');

    const manager = new WebDAVSyncManager();
    await manager.initialize({
      url: config.url,
      username: config.username,
      password: config.password,
      remotePath: settings.remotePath,
    });
    setSyncManager(manager);

    notifyCloudSyncStatusChange();
    triggerHaptic('light');
  };

  // ============================================
  // 连接和同步操作
  // ============================================

  const testConnection = async () => {
    if (!settings.url || !settings.username || !settings.password) {
      setError('Заполните все настройки WebDAV');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError('');

    try {
      const manager = new WebDAVSyncManager();
      const connected = await manager.initialize({
        url: settings.url,
        username: settings.username,
        password: settings.password,
        remotePath: settings.remotePath,
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
            (settings.remotePath
              ? 'Ошибка подключения: проверьте адрес сервера, логин, пароль и путь'
              : 'Ошибка подключения: проверьте адрес сервера, логин или пароль')
        );
      }
    } catch (err) {
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка подключения: ${errorMsg}`);
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
        manager = new WebDAVSyncManager();
        const skipTest = settings.lastConnectionSuccess === true;
        const connected = await manager.initialize(
          {
            url: settings.url,
            username: settings.username,
            password: settings.password,
            remotePath: settings.remotePath,
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

      const result: WebDAVSyncResult = await manager.sync({
        preferredDirection: direction,
        onProgress: progress => {
          setSyncProgress({
            phase: progress.phase,
            message: progress.message,
            percentage: progress.percentage,
          });
        },
      });

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
          title: result.message || 'Ошибка синхронизации WebDAV',
          duration: 3000,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка синхронизации: ${errorMsg}`);
      showToast({
        type: 'error',
        title: `Ошибка синхронизации WebDAV: ${errorMsg}`,
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
        manager = new WebDAVSyncManager();
        const connected = await manager.initialize(
          {
            url: settings.url,
            username: settings.username,
            password: settings.password,
            remotePath: settings.remotePath,
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
        serviceName="WebDAV"
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
          {/* URL */}
          <div>
            <label
              htmlFor="webdav-url"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Адрес сервера
            </label>
            <input
              id="webdav-url"
              type="url"
              value={settings.url}
              onChange={e => onSettingChange('url', e.target.value)}
              placeholder="https://dav.jianguoyun.com/dav/"
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
            <div className="mt-1.5 space-y-1">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Яндекс Диск: https://webdav.yandex.ru/
              </p>
            </div>
          </div>

          {/* 账号 */}
          <div>
            <label
              htmlFor="webdav-username"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Логин
            </label>
            <input
              id="webdav-username"
              type="text"
              value={settings.username}
              onChange={e => onSettingChange('username', e.target.value)}
              placeholder="username"
              autoComplete="username"
              className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* 密码 */}
          <div>
            <label
              htmlFor="webdav-password"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Пароль
            </label>
            <div className="relative">
              <input
                id="webdav-password"
                type={showPassword ? 'text' : 'password'}
                value={settings.password}
                onChange={e => onSettingChange('password', e.target.value)}
                placeholder="password"
                autoComplete="current-password"
                className="w-full rounded-md border border-neutral-200/50 bg-neutral-50 px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2 -translate-y-1/2 transform p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 远程路径 */}
          <div>
            <label
              htmlFor="webdav-remote-path"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Папка на сервере
            </label>
            <input
              id="webdav-remote-path"
              type="text"
              value={settings.remotePath}
              onChange={e => onSettingChange('remotePath', e.target.value)}
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

      {/* WebDAV 配置教程 */}
      <WebDAVTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
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
        title="Журнал синхронизации WebDAV"
      />
    </div>
  );
};
