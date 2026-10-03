/**
 * 同步计划器
 * 实现三路合并算法，计算需要执行的同步操作
 * 参考 remotely-save 的同步算法 V3
 */

import type {
  FileMetadata,
  SyncMetadataV2,
  SyncPlan,
  FileChange,
} from './types';

import { ConflictStrategy, FileChangeType } from './types';
import { areFilesEqual } from './utils';

export class SyncPlanner {
  /**
   * 计算同步计划
   * 使用三路合并算法：本地 vs 远程 vs 基准（上次同步状态）
   *
   * @param localFiles 当前本地文件元数据
   * @param remoteMetadata 远程元数据
   * @param baseMetadata 基准元数据（上次成功同步时的本地元数据）
   * @param conflictStrategy 冲突解决策略
   */
  calculateSyncPlan(
    localFiles: Record<string, FileMetadata>,
    remoteMetadata: SyncMetadataV2 | null,
    baseMetadata: SyncMetadataV2 | null,
    conflictStrategy: ConflictStrategy = ConflictStrategy.MANUAL
  ): SyncPlan {
    const plan: SyncPlan = {
      upload: [],
      download: [],
      deleteLocal: [],
      deleteRemote: [],
      conflicts: [],
      unchanged: [],
    };

    // 如果没有远程元数据，说明是首次同步，上传所有本地文件
    if (!remoteMetadata) {
      Object.values(localFiles).forEach(file => {
        plan.upload.push(file);
      });
      return plan;
    }

    // 收集所有相关的文件键名
    const allKeys = new Set<string>([
      ...Object.keys(localFiles),
      ...Object.keys(remoteMetadata.files),
      ...(baseMetadata ? Object.keys(baseMetadata.files) : []),
    ]);

    // 对每个文件进行三路比较
    allKeys.forEach(key => {
      const change = this.analyzeFileChange(
        key,
        localFiles[key],
        remoteMetadata.files[key],
        baseMetadata?.files[key]
      );

      this.applyChangeToplan(change, plan, conflictStrategy);
    });

    return plan;
  }

  /**
   * 分析单个文件的变化
   * 实现三路合并的核心逻辑
   */
  private analyzeFileChange(
    key: string,
    local: FileMetadata | undefined,
    remote: FileMetadata | undefined,
    base: FileMetadata | undefined
  ): FileChange {
    const change: FileChange = {
      key,
      local,
      remote,
      base,
      type: FileChangeType.UNCHANGED,
    };

    // 场景 1: 三方都不存在（不应该发生，但防御性编程）
    if (!local && !remote && !base) {
      change.type = FileChangeType.UNCHANGED;
      return change;
    }

    // 场景 2: 本地和远程都存在，基准不存在
    // 说明两端都新增了同名文件
    // 这是全新设备首次同步的常见场景
    if (local && remote && !base) {
      const isSame = this.isSameFile(local, remote);

      // 🔍 临时启用详细日志用于调试
      console.warn(`🔍 [${key}] 场景2-首次同步冲突检测:`, {
        本地哈希: local.hash.substring(0, 12),
        远程哈希: remote.hash.substring(0, 12),
        本地大小: local.size,
        远程大小: remote.size,
        本地时间: new Date(local.mtimeCli).toLocaleString(),
        远程时间: new Date(remote.mtimeCli).toLocaleString(),
        内容相同: isSame,
      });

      if (isSame) {
        // ✅ 内容相同，无需同步
        change.type = FileChangeType.UNCHANGED;
      } else {
        // ⚠️ 内容不同，但需要进一步判断
        // 检查是否是刚刚同步完成但本地元数据还没更新的情况
        // 如果远程文件的哈希与本地文件的哈希非常接近（同一数据源）
        // 则认为这是正常的同步后状态，不是冲突

        // 简化策略：如果文件大小相同但哈希不同，优先下载远程
        // 这种情况通常是因为时间戳等动态字段导致的哈希差异
        if (local.size === remote.size) {
          // 大小相同，哈希不同，可能是时间戳问题
          // 选择更新的版本（通常是远程）
          if (remote.mtimeCli >= local.mtimeCli) {
            change.type = FileChangeType.MODIFIED;
            change.direction = 'download';
          } else {
            change.type = FileChangeType.MODIFIED;
            change.direction = 'upload';
          }
        } else {
          // 大小和哈希都不同，真正的冲突
          change.type = FileChangeType.CONFLICT;
          change.direction = 'download'; // 默认建议下载（保留云端数据）
        }
      }
      return change;
    } // 场景 3: 只有本地存在
    if (local && !remote && !base) {
      // 本地新增的文件 -> 上传
      change.type = FileChangeType.ADDED;
      change.direction = 'upload';
      return change;
    }

    // 场景 4: 只有远程存在
    if (!local && remote && !base) {
      // 远程新增的文件 -> 下载
      // 这是全新设备首次同步的理想场景
      change.type = FileChangeType.ADDED;
      change.direction = 'download';
      return change;
    }

    // 场景 5: 本地和基准存在，远程不存在
    if (local && !remote && base) {
      if (this.isSameFile(local, base)) {
        // 本地未改变，远程删除 -> 本地也删除
        change.type = FileChangeType.DELETED;
      } else {
        // 本地已修改，远程删除 -> 冲突
        change.type = FileChangeType.CONFLICT;
      }
      return change;
    }

    // 场景 6: 远程和基准存在，本地不存在
    if (!local && remote && base) {
      if (this.isSameFile(remote, base)) {
        // 远程未改变，本地删除 -> 远程也删除
        change.type = FileChangeType.DELETED;
      } else {
        // 远程已修改，本地删除 -> 冲突（或下载）
        change.type = FileChangeType.CONFLICT;
      }
      return change;
    }

    // 场景 7: 本地和远程存在，基准不存在（已在场景2处理）
    // 场景 8: 三方都存在 - 最复杂的情况
    if (local && remote && base) {
      const localChanged = !this.isSameFile(local, base);
      const remoteChanged = !this.isSameFile(remote, base);

      if (!localChanged && !remoteChanged) {
        // 都没变化 -> 无需操作
        change.type = FileChangeType.UNCHANGED;
      } else if (localChanged && !remoteChanged) {
        // 只有本地变化 -> 上传
        change.type = FileChangeType.MODIFIED;
        change.direction = 'upload';
      } else if (!localChanged && remoteChanged) {
        // 只有远程变化 -> 下载
        change.type = FileChangeType.MODIFIED;
        change.direction = 'download';
      } else {
        // 两边都变化了
        if (this.isSameFile(local, remote)) {
          // 变化后内容一致 -> 无需操作
          change.type = FileChangeType.UNCHANGED;
        } else {
          // 变化后内容不一致 -> 冲突
          change.type = FileChangeType.CONFLICT;
        }
      }
      return change;
    }

    // 场景 9: 只有基准存在（本地和远程都删除了）
    if (!local && !remote && base) {
      change.type = FileChangeType.DELETED;
      return change;
    }

    return change;
  }

  /**
   * 将文件变化应用到同步计划中
   */
  private applyChangeToplan(
    change: FileChange,
    plan: SyncPlan,
    conflictStrategy: ConflictStrategy
  ): void {
    const { local, remote, base, type } = change;

    switch (type) {
      case FileChangeType.UNCHANGED:
        if (local) {
          plan.unchanged.push(local);
        }
        break;

      case FileChangeType.ADDED:
        // 根据 direction 决定是上传还是下载
        if (change.direction === 'upload' && local) {
          // 本地新增 -> 上传
          plan.upload.push(local);
        } else if (change.direction === 'download' && remote) {
          // 远程新增 -> 下载
          plan.download.push(remote);
        } else {
          // 降级逻辑：优先本地
          if (local && !remote) {
            plan.upload.push(local);
          } else if (remote && !local) {
            plan.download.push(remote);
          }
        }
        break;

      case FileChangeType.MODIFIED:
        // 根据 direction 决定是上传还是下载
        if (change.direction === 'upload' && local) {
          // 本地修改 -> 上传
          plan.upload.push(local);
        } else if (change.direction === 'download' && remote) {
          // 远程修改 -> 下载
          plan.download.push(remote);
        } else {
          // 降级逻辑：检查哪个更新
          if (local && base && !this.isSameFile(local, base)) {
            plan.upload.push(local);
          } else if (remote) {
            plan.download.push(remote);
          }
        }
        break;

      case FileChangeType.DELETED:
        if (!local && remote) {
          // 本地删除了 -> 远程也删除
          plan.deleteRemote.push(remote);
        } else if (local && !remote) {
          // 远程删除了 -> 本地也删除
          plan.deleteLocal.push(local);
        }
        break;

      case FileChangeType.CONFLICT:
        // 根据策略解决冲突
        this.resolveConflict(change, plan, conflictStrategy);
        break;
    }
  }

  /**
   * 解决冲突
   * 特别处理首次同步的场景
   */
  private resolveConflict(
    change: FileChange,
    plan: SyncPlan,
    strategy: ConflictStrategy
  ): void {
    const { local, remote, base } = change;

    if (!local || !remote) {
      // 如果其中一方不存在，添加到冲突列表让用户决定
      if (local) plan.conflicts.push(local);
      if (remote) plan.conflicts.push(remote);
      return;
    }

    // 特殊处理：首次同步场景（无基准元数据）
    // 这种情况下通常应该保留远程数据（用户的主要数据）
    if (!base && strategy === ConflictStrategy.MANUAL) {
      // 标记为冲突，但添加建议方向
      plan.conflicts.push({
        ...local,
        // 添加自定义属性用于 UI 显示建议
        // @ts-expect-error - 运行时添加的提示字段
        suggestedDirection: 'download',
      });
      return;
    }

    switch (strategy) {
      case ConflictStrategy.KEEP_NEWER:
        // 保留更新的版本
        if (local.mtimeCli > remote.mtimeCli) {
          plan.upload.push(local);
        } else if (remote.mtimeCli > local.mtimeCli) {
          plan.download.push(remote);
        } else {
          // 时间相同，按大小
          if (local.size > remote.size) {
            plan.upload.push(local);
          } else {
            plan.download.push(remote);
          }
        }
        break;

      case ConflictStrategy.KEEP_LARGER:
        // 保留更大的文件
        if (local.size > remote.size) {
          plan.upload.push(local);
        } else if (remote.size > local.size) {
          plan.download.push(remote);
        } else {
          // 大小相同，按时间
          if (local.mtimeCli > remote.mtimeCli) {
            plan.upload.push(local);
          } else {
            plan.download.push(remote);
          }
        }
        break;

      case ConflictStrategy.KEEP_LOCAL:
        // 保留本地版本
        plan.upload.push(local);
        break;

      case ConflictStrategy.KEEP_REMOTE:
        // 保留远程版本
        plan.download.push(remote);
        break;

      case ConflictStrategy.KEEP_BOTH:
        // 保留两者，远程文件需要重命名后下载
        plan.upload.push(local);
        // 创建重命名的远程副本
        const renamedRemote: FileMetadata = {
          ...remote,
          key: this.generateConflictName(remote.key),
        };
        plan.download.push(renamedRemote);
        break;

      case ConflictStrategy.MANUAL:
      default:
        // 手动解决，添加到冲突列表
        plan.conflicts.push(local);
        break;
    }
  }

  /**
   * 判断两个文件是否相同
   */
  private isSameFile(file1: FileMetadata, file2: FileMetadata): boolean {
    return areFilesEqual(file1, file2);
  }

  /**
   * 判断 file1 是否比 file2 更新
   */
  private isFileNewer(file1: FileMetadata, file2: FileMetadata): boolean {
    return file1.mtimeCli > file2.mtimeCli;
  }

  /**
   * 生成冲突文件名
   */
  private generateConflictName(key: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const parts = key.split('.');

    if (parts.length > 1) {
      const ext = parts.pop();
      const name = parts.join('.');
      return `${name}-conflict-${timestamp}.${ext}`;
    }

    return `${key}-conflict-${timestamp}`;
  }

  /**
   * 验证同步计划（检查是否安全）
   */
  validatePlan(
    plan: SyncPlan,
    maxDeletePercent: number = 0.3,
    maxDeleteCount: number = 100
  ): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];

    const totalFiles =
      plan.upload.length +
      plan.download.length +
      plan.unchanged.length +
      plan.conflicts.length;

    const deleteCount = plan.deleteLocal.length + plan.deleteRemote.length;

    // 检查删除比例
    if (totalFiles > 0) {
      const deletePercent = deleteCount / totalFiles;
      if (deletePercent > maxDeletePercent) {
        warnings.push(
          `⚠️ Будет удалено ${deleteCount} файлов (${(deletePercent * 100).toFixed(1)}%），` +
            `Больше безопасного порога ${(maxDeletePercent * 100).toFixed(0)}%`
        );
      }
    }

    // 检查删除数量
    if (deleteCount > maxDeleteCount) {
      warnings.push(
        `⚠️ Будет удалено ${deleteCount} файлов, больше безопасного порога ${maxDeleteCount} шт.`
      );
    }

    // 检查冲突
    if (plan.conflicts.length > 0) {
      warnings.push(
        `⚠️ Найдено ${plan.conflicts.length} конфликтующих файлов, нужно решить вручную`
      );
    }

    return {
      safe: warnings.length === 0,
      warnings,
    };
  }

  /**
   * 生成同步计划摘要（用于日志和预览）
   */
  generatePlanSummary(plan: SyncPlan): string {
    const parts: string[] = [];

    if (plan.upload.length > 0) {
      parts.push(`Загрузить ${plan.upload.length} файлов`);
    }
    if (plan.download.length > 0) {
      parts.push(`Скачать ${plan.download.length} файлов`);
    }
    if (plan.deleteLocal.length > 0) {
      parts.push(`Удалить на устройстве ${plan.deleteLocal.length} шт.`);
    }
    if (plan.deleteRemote.length > 0) {
      parts.push(`Удалить в облаке ${plan.deleteRemote.length} шт.`);
    }
    if (plan.conflicts.length > 0) {
      parts.push(`${plan.conflicts.length} конфликтов`);
    }
    if (plan.unchanged.length > 0) {
      parts.push(`${plan.unchanged.length} без изменений`);
    }

    return parts.length > 0 ? parts.join('，') : 'Синхронизация не нужна';
  }
}
