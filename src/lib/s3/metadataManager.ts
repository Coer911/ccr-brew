/**
 * 同步元数据管理器
 * 负责本地和远程元数据的读取、更新和版本迁移
 */

import { Storage } from '@/lib/core/storage';
import type { S3Client } from './s3Client';
import type {
  SyncMetadata,
  SyncMetadataV1,
  SyncMetadataV2,
  FileMetadata,
} from './types';
import { safeJsonParse } from './utils';

const METADATA_KEY = 's3-sync-metadata';
const METADATA_REMOTE_KEY = 'sync-metadata.json';

export class MetadataManager {
  constructor(
    private client: S3Client | null,
    private deviceId: string
  ) {}

  /**
   * 获取本地元数据
   */
  async getLocalMetadata(): Promise<SyncMetadataV2 | null> {
    try {
      const stored = await Storage.get(METADATA_KEY);
      if (!stored) return null;

      const metadata = safeJsonParse<SyncMetadata | null>(stored, null);
      if (!metadata) return null;

      // 如果是旧版本，迁移到新版本
      if (this.isV1Metadata(metadata)) {
        return this.migrateV1ToV2(metadata);
      }

      return metadata;
    } catch (error) {
      console.error('获取本地元数据失败:', error);
      return null;
    }
  }

  /**
   * 获取远程元数据
   */
  async getRemoteMetadata(): Promise<SyncMetadataV2 | null> {
    if (!this.client) return null;

    try {
      const content = await this.client.downloadFile(METADATA_REMOTE_KEY);
      if (!content) return null;

      const metadata = safeJsonParse<SyncMetadata | null>(content, null);
      if (!metadata) return null;

      // 🔍 临时启用详细日志用于调试
      console.warn('📥 远程元数据详情:', {
        版本: 'version' in metadata ? metadata.version : 'V1',
        最后同步: new Date(metadata.lastSyncTime).toLocaleString(),
        设备ID: metadata.deviceId,
        文件数:
          'files' in metadata && typeof metadata.files === 'object'
            ? Object.keys(metadata.files).length
            : Array.isArray(metadata.files)
              ? metadata.files.length
              : 0,
        文件列表:
          'files' in metadata && typeof metadata.files === 'object'
            ? Object.keys(metadata.files)
            : metadata.files,
      });

      // 如果是旧版本，迁移到新版本
      if (this.isV1Metadata(metadata)) {
        const migrated = this.migrateV1ToV2(metadata);
        console.warn('📦 V1→V2 迁移完成:', {
          迁移后文件: Object.keys(migrated.files),
        });
        return migrated;
      }

      return metadata;
    } catch (error) {
      console.warn('获取远程元数据失败:', error);
      return null;
    }
  }

  /**
   * 保存本地元数据
   */
  async saveLocalMetadata(metadata: SyncMetadataV2): Promise<void> {
    try {
      await Storage.set(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('保存本地元数据失败:', error);
      throw error;
    }
  }

  /**
   * 保存远程元数据
   */
  async saveRemoteMetadata(metadata: SyncMetadataV2): Promise<void> {
    if (!this.client) {
      throw new Error('Клиент S3 не инициализирован');
    }

    try {
      const content = JSON.stringify(metadata, null, 2);
      const uploadResult = await this.client.uploadFile(
        METADATA_REMOTE_KEY,
        content
      );

      // 处理新的返回格式：boolean 或 { success: false; error: string }
      const success = uploadResult === true;
      const errorDetail =
        typeof uploadResult === 'object' && uploadResult.error
          ? uploadResult.error
          : null;

      if (!success) {
        throw new Error(errorDetail || 'Не удалось загрузить метаданные');
      }
    } catch (error) {
      console.error('保存远程元数据失败:', error);
      throw error;
    }
  }

  /**
   * 创建新的元数据
   */
  createNewMetadata(files: Record<string, FileMetadata> = {}): SyncMetadataV2 {
    return {
      version: '2.0.0',
      lastSyncTime: Date.now(),
      deviceId: this.deviceId,
      files,
      deletedFiles: [],
    };
  }

  /**
   * 更新元数据中的文件记录
   */
  updateFileInMetadata(
    metadata: SyncMetadataV2,
    fileMetadata: FileMetadata
  ): SyncMetadataV2 {
    return {
      ...metadata,
      lastSyncTime: Date.now(),
      files: {
        ...metadata.files,
        [fileMetadata.key]: fileMetadata,
      },
    };
  }

  /**
   * 从元数据中删除文件记录
   */
  deleteFileFromMetadata(
    metadata: SyncMetadataV2,
    fileKey: string
  ): SyncMetadataV2 {
    const newFiles = { ...metadata.files };
    delete newFiles[fileKey];

    return {
      ...metadata,
      lastSyncTime: Date.now(),
      files: newFiles,
      deletedFiles: [...(metadata.deletedFiles || []), fileKey],
    };
  }

  /**
   * 判断是否为 V1 版本元数据
   */
  private isV1Metadata(metadata: SyncMetadata): metadata is SyncMetadataV1 {
    return (
      !metadata.version ||
      metadata.version === '1.0.0' ||
      ('dataHash' in metadata && typeof metadata.dataHash === 'string')
    );
  }

  /**
   * 将 V1 元数据迁移到 V2
   */
  private migrateV1ToV2(v1: SyncMetadataV1): SyncMetadataV2 {
    const files: Record<string, FileMetadata> = {};

    // 如果 V1 有文件列表，尝试转换
    if (v1.files && Array.isArray(v1.files)) {
      v1.files.forEach(fileName => {
        const key = fileName.replace(/\.json$/i, '');
        files[key] = {
          key,
          size: 0, // V1 不记录大小
          mtimeCli: v1.lastSyncTime, // 使用同步时间作为修改时间
          hash: v1.dataHash || '', // 使用整体哈希或空字符串
          syncedAt: v1.lastSyncTime,
        };
      });
    }

    return {
      version: '2.0.0',
      lastSyncTime: v1.lastSyncTime,
      deviceId: v1.deviceId,
      files,
      deletedFiles: [],
    };
  }

  /**
   * 比较两个元数据，找出差异
   */
  diffMetadata(
    local: SyncMetadataV2,
    remote: SyncMetadataV2
  ): {
    onlyInLocal: string[];
    onlyInRemote: string[];
    inBoth: string[];
    different: string[];
  } {
    const localKeys = new Set(Object.keys(local.files));
    const remoteKeys = new Set(Object.keys(remote.files));

    const onlyInLocal: string[] = [];
    const onlyInRemote: string[] = [];
    const inBoth: string[] = [];
    const different: string[] = [];

    // 检查本地独有的文件
    localKeys.forEach(key => {
      if (!remoteKeys.has(key)) {
        onlyInLocal.push(key);
      } else {
        inBoth.push(key);
        // 检查是否有差异
        const localFile = local.files[key];
        const remoteFile = remote.files[key];
        if (this.hasFileChanged(localFile, remoteFile)) {
          different.push(key);
        }
      }
    });

    // 检查远程独有的文件
    remoteKeys.forEach(key => {
      if (!localKeys.has(key)) {
        onlyInRemote.push(key);
      }
    });

    return { onlyInLocal, onlyInRemote, inBoth, different };
  }

  /**
   * 判断文件是否发生变化
   */
  private hasFileChanged(file1: FileMetadata, file2: FileMetadata): boolean {
    // 如果有哈希值，优先比较哈希
    if (file1.hash && file2.hash) {
      return file1.hash !== file2.hash;
    }

    // 否则比较修改时间和大小
    return file1.mtimeCli !== file2.mtimeCli || file1.size !== file2.size;
  }

  /**
   * 合并元数据（用于冲突解决）
   */
  mergeMetadata(
    local: SyncMetadataV2,
    remote: SyncMetadataV2,
    strategy: 'prefer-local' | 'prefer-remote' | 'keep-both' = 'prefer-local'
  ): SyncMetadataV2 {
    const merged = this.createNewMetadata();

    const allKeys = new Set([
      ...Object.keys(local.files),
      ...Object.keys(remote.files),
    ]);

    allKeys.forEach(key => {
      const localFile = local.files[key];
      const remoteFile = remote.files[key];

      if (!localFile && remoteFile) {
        // 只在远程存在
        merged.files[key] = remoteFile;
      } else if (localFile && !remoteFile) {
        // 只在本地存在
        merged.files[key] = localFile;
      } else if (localFile && remoteFile) {
        // 两边都存在，根据策略选择
        if (strategy === 'prefer-local') {
          merged.files[key] = localFile;
        } else if (strategy === 'prefer-remote') {
          merged.files[key] = remoteFile;
        } else {
          // keep-both: 选择更新的
          merged.files[key] =
            localFile.mtimeCli > remoteFile.mtimeCli ? localFile : remoteFile;
        }
      }
    });

    return merged;
  }
}
