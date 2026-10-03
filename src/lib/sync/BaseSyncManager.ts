/**
 * 统一的同步管理器基类
 * S3 和 WebDAV 都继承此类，确保逻辑完全一致
 *
 * 当前仅支持强制上传/下载模式，不支持增量同步
 */

import { Storage } from '@/lib/core/storage';
import {
  createFilesMetadataFromData,
  generateDeviceId,
  safeJsonParse,
} from '@/lib/s3/utils';

import type {
  SyncResult,
  SyncMetadataV2,
  FileMetadata,
  SyncOptions,
  BackupRecord,
} from '@/lib/s3/types';
import { BackupManager } from './BackupManager';
import { formatSyncDiagnostic, type SyncDiagnostic } from './types';

/**
 * 存储客户端接口 - S3 和 WebDAV 客户端都需要实现这个接口
 */
export interface IStorageClient {
  testConnection(): Promise<boolean>;
  getLastDiagnostic?(): SyncDiagnostic | null;
  clearDiagnostic?(): void;
  uploadFile(
    key: string,
    content: string
  ): Promise<boolean | { success: false; error: string }>;
  downloadFile(key: string): Promise<string | null>;
  deleteFile(key: string): Promise<boolean>;
  fileExists(key: string): Promise<boolean>;
  listFilesSimple(
    prefix: string
  ): Promise<{ key: string; lastModified?: Date }[]>;
  copyFile(source: string, destination: string): Promise<boolean>;
}

/**
 * 元数据管理器接口
 */
export interface IMetadataManager {
  getRemoteMetadata(): Promise<SyncMetadataV2 | null>;
  getLocalMetadata(): Promise<SyncMetadataV2 | null>;
  saveLocalMetadata(metadata: SyncMetadataV2): Promise<void>;
  saveRemoteMetadata(metadata: SyncMetadataV2): Promise<void>;
}

/**
 * 同步管理器基类
 */
export abstract class BaseSyncManager {
  protected client: IStorageClient | null = null;
  protected metadataManager: IMetadataManager | null = null;
  protected syncInProgress = false;
  protected deviceId: string = '';
  private backupManager: BackupManager | null = null;

  /**
   * 子类需要实现：初始化客户端和元数据管理器
   */
  abstract initialize(config: unknown): Promise<boolean>;

  /**
   * 子类需要实现：获取服务名称（用于日志）
   */
  abstract getServiceName(): string;

  /**
   * 获取备份管理器（延迟初始化）
   */
  private getBackupManager(): BackupManager {
    if (!this.backupManager) {
      this.backupManager = new BackupManager(this.getServiceName());
    }
    return this.backupManager;
  }

  /**
   * 执行同步（仅支持强制上传/下载）
   */
  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      return this.createErrorResult('Синхронизация уже идёт', [
        'Синхронизация уже идёт, попробуйте позже',
      ]);
    }

    if (!this.client || !this.metadataManager) {
      return this.createErrorResult('Менеджер синхронизации не инициализирован', [
        `${this.getServiceName()} — менеджер синхронизации инициализирован неправильно`,
      ]);
    }

    this.syncInProgress = true;
    const debugLogs: string[] = [];
    const addLog = (msg: string) => {
      debugLogs.push(`[${new Date().toISOString()}] ${msg}`);
      console.warn(`📝 [${this.getServiceName()}] ${msg}`);
    };
    const addLogLines = (lines: string[]) => {
      lines.forEach(line => {
        debugLogs.push(line ? `[${new Date().toISOString()}] ${line}` : '');
      });
    };

    const result: SyncResult = {
      success: false,
      message: '',
      uploadedFiles: 0,
      downloadedFiles: 0,
      errors: [],
      debugLogs: [],
    };

    try {
      this.client.clearDiagnostic?.();
      addLog(`Начинаем синхронизацию, направление: ${options.preferredDirection || 'auto'}`);

      // 获取远程元数据（用于备份历史）
      const remoteMetadata = await this.metadataManager.getRemoteMetadata();

      if (options.preferredDirection === 'upload') {
        await this.performUpload(result, options, remoteMetadata, addLog);
      } else if (options.preferredDirection === 'download') {
        await this.performDownload(result, remoteMetadata, addLog);
      } else {
        result.message = 'Укажите направление синхронизации (загрузить или скачать)';
        result.errors.push('Направление синхронизации не указано');
      }

      this.appendResultDiagnostics(result, addLogLines);
      result.debugLogs = debugLogs;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      addLog(`Ошибка синхронизации: ${errorMsg}`);
      result.errors.push(`Ошибка синхронизации: ${errorMsg}`);
      result.message = 'Ошибка синхронизации';
      this.appendResultDiagnostics(result, addLogLines);
      result.debugLogs = debugLogs;
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * 执行上传
   */
  private async performUpload(
    result: SyncResult,
    _options: SyncOptions,
    remoteMetadata: SyncMetadataV2 | null,
    addLog: (msg: string) => void
  ): Promise<void> {
    addLog('Принудительная загрузка');

    // 获取本地数据
    const content = await this.getFileContent('brew-guide-data.json');
    if (!content) {
      result.message = 'Ошибка загрузки: на устройстве нет данных';
      result.errors.push('Не удалось получить данные с устройства');
      return;
    }

    const { calculateHash } = await import('@/lib/s3/utils');
    const hash = await calculateHash(content);

    // 1. 先上传主文件
    addLog('Загружаем основной файл...');
    const uploadResult = await this.client!.uploadFile(
      'brew-guide-data.json',
      content
    );
    if (uploadResult !== true) {
      const errorDetail =
        typeof uploadResult === 'object' ? uploadResult.error : 'Неизвестная ошибка';
      const errorMsg = `Ошибка загрузки brew-guide-data.json: ${errorDetail}`;
      result.errors.push(errorMsg);
      result.message = errorMsg;
      return;
    }
    result.uploadedFiles = 1;
    addLog('Основной файл загружен');

    // 2. 通过服务器端复制创建备份（不消耗客户端带宽）
    addLog('Создаём копию (на сервере)...');
    const lastBackupHash = remoteMetadata?.backupHistory?.slice(-1)[0]?.hash;
    const backupCreated =
      await this.getBackupManager().performBackupAfterUpload(
        this.client!,
        'brew-guide-data.json',
        hash,
        lastBackupHash
      );
    if (!backupCreated) {
      const warning = 'Не удалось создать копию; основной файл загружен, продолжаем обновлять метаданные';
      result.warnings = [...(result.warnings ?? []), warning];
      addLog(warning);
    }

    // 3. 更新元数据
    const localFilesMetadata = await this.getLocalFilesMetadata();
    const metadataUpdated = await this.updateMetadataAfterSync(
      localFilesMetadata,
      addLog
    );
    if (!metadataUpdated) {
      result.message = 'Ошибка: основной файл загружен, но метаданные синхронизации не обновились';
      result.errors.push(
        'Метаданные синхронизации не обновились; основной файл в облаке, возможно, уже записан — посмотрите диагностику и загрузите снова'
      );
      return;
    }
    addLog('Метаданные обновлены');

    result.success = true;
    result.message = `Загружено: ${result.uploadedFiles} файлов`;
  }

  /**
   * 执行下载
   */
  private async performDownload(
    result: SyncResult,
    remoteMetadata: SyncMetadataV2 | null,
    addLog: (msg: string) => void
  ): Promise<void> {
    addLog('Принудительное скачивание');

    if (!remoteMetadata || Object.keys(remoteMetadata.files).length === 0) {
      result.message = 'Ошибка скачивания: в облаке нет данных';
      result.success = false;
      return;
    }

    // 下载文件
    for (const [key] of Object.entries(remoteMetadata.files)) {
      try {
        addLog(`Скачиваем: ${key}`);
        const content = await this.client!.downloadFile(key);
        if (!content) {
          result.errors.push(`Скачать ${key} — ошибка`);
          continue;
        }
        await this.saveFileContent(key, content);
        result.downloadedFiles++;
        addLog(`Скачано: ${key}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Скачать ${key} ошибка: ${errorMsg}`);
      }
    }

    // 更新元数据
    const metadataUpdated = await this.updateMetadataAfterSync(
      remoteMetadata.files,
      addLog
    );
    if (metadataUpdated) {
      addLog('Метаданные обновлены');
    } else {
      result.errors.push('Метаданные синхронизации не обновились: данные записаны, но состояние синхронизации не сохранено');
    }

    result.success = result.errors.length === 0;
    result.message = result.success
      ? `Скачано ${result.downloadedFiles} файлов`
      : `Скачивание завершено, но ошибок: ${result.errors.length} `;
  }

  /**
   * 更新同步后的元数据
   */
  private async updateMetadataAfterSync(
    files: Record<string, FileMetadata>,
    addLog?: (msg: string) => void
  ): Promise<boolean> {
    if (!this.metadataManager) return false;

    try {
      const metadata: SyncMetadataV2 = {
        version: '2.0.0',
        lastSyncTime: Date.now(),
        deviceId: this.deviceId,
        files,
        deletedFiles: [],
      };

      await this.metadataManager.saveLocalMetadata(metadata);
      await this.metadataManager.saveRemoteMetadata(metadata);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [${this.getServiceName()}] 更新元数据失败:`, error);
      addLog?.(`Ошибка обновления метаданных: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 获取本地文件元数据
   */
  protected async getLocalFilesMetadata(): Promise<
    Record<string, FileMetadata>
  > {
    try {
      const { DataManager } = await import('@/lib/core/dataManager');
      const fullExportString = await DataManager.exportAllData();
      const exportDataObj = safeJsonParse(fullExportString, {});
      const dataMap: Record<string, unknown> = {
        'brew-guide-data.json': exportDataObj,
      };
      return await createFilesMetadataFromData(dataMap);
    } catch (error) {
      console.error(`${this.getServiceName()} 获取本地文件元数据失败:`, error);
      return {};
    }
  }

  /**
   * 获取文件内容
   */
  protected async getFileContent(key: string): Promise<string | null> {
    try {
      if (key === 'brew-guide-data.json' || key === 'brew-guide-data') {
        const { DataManager } = await import('@/lib/core/dataManager');
        return await DataManager.exportAllData();
      }
      return await Storage.get(key);
    } catch (error) {
      console.error(`获取文件 ${key} 内容失败:`, error);
      return null;
    }
  }

  /**
   * 保存文件内容
   */
  protected async saveFileContent(key: string, content: string): Promise<void> {
    if (key === 'brew-guide-data.json' || key === 'brew-guide-data') {
      const { DataManager } = await import('@/lib/core/dataManager');
      await DataManager.importAllData(content);
    } else {
      await Storage.set(key, content);
    }
  }

  /**
   * 获取或创建设备 ID
   */
  protected async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await Storage.get('device-id');
    if (!deviceId) {
      deviceId = await generateDeviceId();
      await Storage.set('device-id', deviceId);
    }
    return deviceId;
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(message: string, errors: string[]): SyncResult {
    return {
      success: false,
      message,
      uploadedFiles: 0,
      downloadedFiles: 0,
      errors,
    };
  }

  private appendResultDiagnostics(
    result: SyncResult,
    addLogLines: (lines: string[]) => void
  ): void {
    if (!result.success && result.message) {
      addLogLines(['', '--- Итог синхронизации ---', result.message]);
    }

    if (result.errors.length > 0) {
      addLogLines([
        '',
        `--- Ошибки (${result.errors.length} шт.) ---`,
        ...result.errors.map((error, index) => `${index + 1}. ${error}`),
      ]);
    }

    if (result.warnings && result.warnings.length > 0) {
      addLogLines([
        '',
        `--- Предупреждения (${result.warnings.length} шт.) ---`,
        ...result.warnings.map((warning, index) => `${index + 1}. ${warning}`),
      ]);
    }

    if (
      !result.success ||
      result.errors.length > 0 ||
      result.warnings?.length
    ) {
      const diagnostic = this.client?.getLastDiagnostic?.() ?? null;
      const diagnosticLines = formatSyncDiagnostic(diagnostic);
      if (diagnosticLines.length > 0) {
        addLogLines(['', ...diagnosticLines]);
      }
    }
  }

  /**
   * 获取最后同步时间
   */
  async getLastSyncTime(): Promise<Date | null> {
    if (!this.metadataManager) return null;
    const metadata = await this.metadataManager.getLocalMetadata();
    return metadata?.lastSyncTime ? new Date(metadata.lastSyncTime) : null;
  }

  /**
   * 检查同步状态
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * 获取可用备份列表（直接从服务器扫描）
   */
  async listBackups(): Promise<BackupRecord[]> {
    if (!this.client) return [];
    return this.getBackupManager().listBackupsFromServer(this.client);
  }

  /**
   * 从备份恢复数据
   */
  async restoreFromBackup(backupKey: string): Promise<boolean> {
    if (!this.client) {
      console.error(`❌ [${this.getServiceName()}] 恢复失败：客户端未初始化`);
      return false;
    }

    const content = await this.getBackupManager().restoreBackup(
      this.client,
      backupKey
    );
    if (!content) return false;

    try {
      await this.saveFileContent('brew-guide-data.json', content);
      console.warn(
        `✅ [${this.getServiceName()}] 数据已从备份恢复: ${backupKey}`
      );
      return true;
    } catch (error) {
      console.error(`❌ [${this.getServiceName()}] 恢复数据失败:`, error);
      return false;
    }
  }
}
