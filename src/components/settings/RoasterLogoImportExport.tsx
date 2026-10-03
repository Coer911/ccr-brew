'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import AutocompleteInput from '@/components/common/forms/AutocompleteInput';
import { showToast } from '@/components/common/feedback/LightToast';
import {
  getRoasterConfigsSync,
  getSettingsStore,
} from '@/lib/stores/settingsStore';
import hapticsUtils from '@/lib/ui/haptics';
import { exportJsonFile } from '@/lib/utils/jsonExport';
import DownloadIcon from '@public/images/icons/ui/download-2.svg';
import IosShareIcon from '@public/images/icons/ui/ios-share.svg';

interface RoasterLogoImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  hapticFeedback: boolean;
  /** 当前存在的烘焙商列表（用于导入时匹配） */
  existingRoasters: string[];
  /** 导入完成后的回调 */
  onImportComplete?: () => void;
}

type ImportStep = 'select' | 'preview' | 'processing';

interface ImportedRoasterConfig {
  roasterName: string;
  logoData?: string;
  /** 用户选择的映射目标烘焙商名称 */
  mappedTo?: string;
  /** 是否跳过此项 */
  skip?: boolean;
  /** 是否在现有烘焙商中找到匹配 */
  matched?: boolean;
}

/** 单个导入项组件 */
const RoasterImportItem: React.FC<{
  config: ImportedRoasterConfig;
  hasValidMapping: boolean;
  existingLogo?: string;
  onUpdateMapping: (roasterName: string, mappedTo: string | undefined) => void;
  onToggleSkip: (roasterName: string) => void;
  getSuggestions: (roasterName: string) => string[];
}> = ({
  config,
  hasValidMapping,
  existingLogo,
  onUpdateMapping,
  onToggleSkip,
  getSuggestions,
}) => (
  <div
    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
      config.skip ? 'opacity-40' : 'bg-neutral-50 dark:bg-neutral-800/50'
    }`}
  >
    {/* 导入的图标（主图标，现有图标作为角标叠加） */}
    <div className="relative h-8 w-8 shrink-0">
      <div className="relative h-full w-full overflow-hidden rounded border border-neutral-200/50 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        {config.logoData && (
          <Image
            src={config.logoData}
            alt={config.roasterName}
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </div>
      {hasValidMapping && (
        <div className="absolute -top-1 -right-1 h-4 w-4 overflow-hidden rounded-full border border-white bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          {existingLogo ? (
            <Image
              src={existingLogo}
              alt="Есть"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-neutral-400 dark:text-neutral-500">
              {config.mappedTo?.charAt(0) || ''}
            </div>
          )}
        </div>
      )}
    </div>

    {/* 输入框 */}
    <div className="min-w-0 flex-1">
      <AutocompleteInput
        value={config.skip ? '' : config.mappedTo || ''}
        onChange={val => onUpdateMapping(config.roasterName, val || undefined)}
        placeholder={config.roasterName}
        suggestions={getSuggestions(config.roasterName)}
        disabled={config.skip}
        className={`border-0! py-1! text-sm ${
          !config.skip && !hasValidMapping ? 'text-neutral-400!' : ''
        }`}
      />
    </div>

    {/* 状态 */}
    {hasValidMapping && !config.skip && (
      <Check className="h-4 w-4 shrink-0 text-green-500" />
    )}

    {/* 跳过按钮 */}
    <button
      type="button"
      onClick={() => onToggleSkip(config.roasterName)}
      className="shrink-0 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
    >
      {config.skip ? 'Вернуть' : 'Пропустить'}
    </button>
  </div>
);

/**
 * 烘焙商图标导入导出抽屉组件
 */
const RoasterLogoImportExport: React.FC<RoasterLogoImportExportProps> = ({
  isOpen,
  onClose,
  mode,
  hapticFeedback,
  existingRoasters,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导入状态
  const [importStep, setImportStep] = useState<ImportStep>('select');
  const [importedConfigs, setImportedConfigs] = useState<
    ImportedRoasterConfig[]
  >([]);
  const [_processing, setProcessing] = useState(false);

  // 重置状态
  const resetState = useCallback(() => {
    setImportStep('select');
    setImportedConfigs([]);
    setProcessing(false);
  }, []);

  // 关闭处理
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 退出动画完成后重置状态
  const handleExitComplete = useCallback(() => {
    resetState();
  }, [resetState]);

  // ==================== 导出功能 ====================

  const handleExport = useCallback(async () => {
    try {
      const configs = getRoasterConfigsSync();
      const configsWithLogo = configs.filter(c => c.logoData);

      if (configsWithLogo.length === 0) {
        showToast({ title: 'Нет логотипов обжарщиков для экспорта', type: 'info' });
        return;
      }

      // 构建导出数据
      const exportData = {
        exportDate: new Date().toISOString(),
        type: 'roaster-logos',
        version: 1,
        data: configsWithLogo.map(c => ({
          roasterName: c.roasterName,
          logoData: c.logoData,
        })),
      };

      // 生成文件名
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const fileName = `roaster-logos-${dateStr}.json`;

      await exportJsonFile({
        jsonData: JSON.stringify(exportData, null, 2),
        fileName,
        title: 'Экспорт логотипов обжарщиков',
        text: 'Выберите, куда сохранить',
        dialogTitle: 'Экспорт логотипов обжарщиков',
      });

      if (hapticFeedback) {
        hapticsUtils.success();
      }
      showToast({
        title: `Выгружено ${configsWithLogo.length} логотипов обжарщиков`,
        type: 'success',
      });
      handleClose();
    } catch (error) {
      console.error('导出失败:', error);
      if (hapticFeedback) {
        hapticsUtils.error();
      }
      showToast({ title: 'Ошибка выгрузки', type: 'error' });
    }
  }, [hapticFeedback, handleClose]);

  // ==================== 导入功能 ====================

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 重置 input
      e.target.value = '';

      try {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
              resolve(result);
              return;
            }

            reject(new Error('Не удалось прочитать файл'));
          };
          reader.onerror = () => {
            reject(reader.error || new Error('Не удалось прочитать файл'));
          };
          reader.readAsText(file);
        });
        const data = JSON.parse(text);

        // 验证数据格式
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Неверный формат файла');
        }

        // 解析导入的配置
        const configs: ImportedRoasterConfig[] = data.data
          .filter(
            (item: { roasterName?: string; logoData?: string }) =>
              item.roasterName && item.logoData
          )
          .map((item: { roasterName: string; logoData?: string }) => {
            const matched = existingRoasters.includes(item.roasterName);
            return {
              roasterName: item.roasterName,
              logoData: item.logoData,
              matched,
              mappedTo: matched ? item.roasterName : undefined,
              skip: false,
            };
          });

        if (configs.length === 0) {
          showToast({ title: 'В файле нет подходящих логотипов', type: 'info' });
          return;
        }

        setImportedConfigs(configs);
        setImportStep('preview');
      } catch (error) {
        console.error('解析文件失败:', error);
        if (hapticFeedback) {
          hapticsUtils.error();
        }
        showToast({ title: 'Неверный формат файла', type: 'error' });
      }
    },
    [existingRoasters, hapticFeedback]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 更新映射 - 检查是否匹配现有烘焙商
  const updateMapping = useCallback(
    (roasterName: string, mappedTo: string | undefined) => {
      const isMatched = mappedTo ? existingRoasters.includes(mappedTo) : false;
      setImportedConfigs(prev =>
        prev.map(c =>
          c.roasterName === roasterName
            ? { ...c, mappedTo, skip: false, matched: isMatched }
            : c
        )
      );
    },
    [existingRoasters]
  );

  // 切换跳过状态
  const toggleSkip = useCallback((roasterName: string) => {
    setImportedConfigs(prev =>
      prev.map(c =>
        c.roasterName === roasterName
          ? {
              ...c,
              skip: !c.skip,
              mappedTo: c.skip ? c.roasterName : undefined,
            }
          : c
      )
    );
  }, []);

  // 执行导入
  const executeImport = useCallback(async () => {
    setProcessing(true);
    setImportStep('processing');

    try {
      const store = getSettingsStore();
      let importedCount = 0;

      for (const config of importedConfigs) {
        if (config.skip || !config.mappedTo || !config.logoData) continue;

        await store.updateRoasterConfig(config.mappedTo, {
          logoData: config.logoData,
        });
        importedCount++;
      }

      if (hapticFeedback) {
        hapticsUtils.success();
      }

      showToast({
        title: `Импортировано ${importedCount} логотипов обжарщиков`,
        type: 'success',
      });
      onImportComplete?.();
      handleClose();
    } catch (error) {
      console.error('导入失败:', error);
      if (hapticFeedback) {
        hapticsUtils.error();
      }
      showToast({ title: 'Ошибка импорта', type: 'error' });
      setImportStep('preview');
    } finally {
      setProcessing(false);
    }
  }, [importedConfigs, hapticFeedback, onImportComplete, handleClose]);

  // 统计信息
  const stats = useMemo(() => {
    const total = importedConfigs.length;
    const matched = importedConfigs.filter(c => c.matched && !c.skip).length;
    const mapped = importedConfigs.filter(
      c =>
        !c.matched &&
        c.mappedTo &&
        existingRoasters.includes(c.mappedTo) &&
        !c.skip
    ).length;
    const skipped = importedConfigs.filter(c => c.skip).length;
    const toImport = matched + mapped;
    return { total, matched, mapped, skipped, toImport };
  }, [importedConfigs, existingRoasters]);

  // 获取现有烘焙商的图标数据 map
  const existingLogosMap = useMemo(() => {
    const configs = getRoasterConfigsSync();
    const map = new Map<string, string>();
    configs.forEach(c => {
      if (c.logoData) {
        map.set(c.roasterName, c.logoData);
      }
    });
    return map;
  }, []);

  // 获取某个配置项可用的烘焙商建议（排除已被其他项映射的）
  const getSuggestionsFor = useCallback(
    (roasterName: string) => {
      const usedTargets = new Set(
        importedConfigs
          .filter(c => c.mappedTo && c.roasterName !== roasterName && !c.skip)
          .map(c => c.mappedTo)
      );
      return existingRoasters.filter(r => !usedTargets.has(r));
    },
    [importedConfigs, existingRoasters]
  );

  // ==================== 渲染 ====================

  // 导出模式
  if (mode === 'export') {
    const configs = getRoasterConfigsSync();
    const configsWithLogo = configs.filter(c => c.logoData);

    return (
      <ActionDrawer
        isOpen={isOpen}
        onClose={handleClose}
        historyId="roaster-logo-export"
        onExitComplete={handleExitComplete}
      >
        <ActionDrawer.Icon icon={IosShareIcon} />
        <ActionDrawer.Content>
          <p className="text-neutral-500 dark:text-neutral-400">
            Будет выгружено
            <span className="mx-1 text-neutral-800 dark:text-neutral-200">
              {configsWithLogo.length}
            </span>
            логотипов обжарщиков — можно поделиться с друзьями или перенести на другое устройство.
          </p>
        </ActionDrawer.Content>
        <ActionDrawer.Actions>
          <ActionDrawer.SecondaryButton onClick={handleClose}>
            Отмена
          </ActionDrawer.SecondaryButton>
          <ActionDrawer.PrimaryButton
            onClick={handleExport}
            disabled={configsWithLogo.length === 0}
          >
            Экспорт
          </ActionDrawer.PrimaryButton>
        </ActionDrawer.Actions>
      </ActionDrawer>
    );
  }

  // 导入模式
  return (
    <>
      <ActionDrawer
        isOpen={isOpen}
        onClose={handleClose}
        historyId="roaster-logo-import"
        onExitComplete={handleExitComplete}
      >
        <ActionDrawer.Switcher activeKey={importStep}>
          {importStep === 'select' && (
            <>
              <ActionDrawer.Icon icon={DownloadIcon} />
              <ActionDrawer.Content>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Выберите JSON-файл с логотипами обжарщиков для импорта.
                </p>
              </ActionDrawer.Content>
              <ActionDrawer.Actions>
                <ActionDrawer.SecondaryButton onClick={handleClose}>
                  Отмена
                </ActionDrawer.SecondaryButton>
                <ActionDrawer.PrimaryButton onClick={triggerFileInput}>
                  Выбрать файл
                </ActionDrawer.PrimaryButton>
              </ActionDrawer.Actions>
            </>
          )}

          {importStep === 'preview' && (
            <>
              <div className="mb-3">
                <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-200">
                  Что будет импортировано
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {stats.toImport} к импорту · {stats.skipped} пропущено · всего{' '}
                  {stats.total} шт.
                </p>
              </div>

              {/* 图标列表 */}
              <div className="-mx-1 mb-5 max-h-[45vh] space-y-1 overflow-y-auto px-1">
                {/* 已匹配的 */}
                {importedConfigs
                  .filter(c => c.matched)
                  .map(config => {
                    const hasValidMapping =
                      config.mappedTo &&
                      existingRoasters.includes(config.mappedTo);
                    const existingLogo = config.mappedTo
                      ? existingLogosMap.get(config.mappedTo)
                      : undefined;

                    return (
                      <RoasterImportItem
                        key={config.roasterName}
                        config={config}
                        hasValidMapping={!!hasValidMapping}
                        existingLogo={existingLogo}
                        onUpdateMapping={updateMapping}
                        onToggleSkip={toggleSkip}
                        getSuggestions={getSuggestionsFor}
                      />
                    );
                  })}

                {/* 未匹配的分组标题 */}
                {importedConfigs.some(c => !c.matched) && (
                  <div className="pt-3 pb-1.5">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Нужно сопоставить вручную
                    </span>
                  </div>
                )}

                {/* 未匹配的 */}
                {importedConfigs
                  .filter(c => !c.matched)
                  .map(config => {
                    const hasValidMapping =
                      config.mappedTo &&
                      existingRoasters.includes(config.mappedTo);
                    const existingLogo = config.mappedTo
                      ? existingLogosMap.get(config.mappedTo)
                      : undefined;

                    return (
                      <RoasterImportItem
                        key={config.roasterName}
                        config={config}
                        hasValidMapping={!!hasValidMapping}
                        existingLogo={existingLogo}
                        onUpdateMapping={updateMapping}
                        onToggleSkip={toggleSkip}
                        getSuggestions={getSuggestionsFor}
                      />
                    );
                  })}
              </div>

              <ActionDrawer.Actions>
                <ActionDrawer.SecondaryButton
                  onClick={() => setImportStep('select')}
                >
                  Назад
                </ActionDrawer.SecondaryButton>
                <ActionDrawer.PrimaryButton
                  onClick={executeImport}
                  disabled={stats.toImport === 0}
                >
                  Импортировать ({stats.toImport})
                </ActionDrawer.PrimaryButton>
              </ActionDrawer.Actions>
            </>
          )}

          {importStep === 'processing' && (
            <>
              <ActionDrawer.Icon icon={DownloadIcon} />
              <ActionDrawer.Content>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Импортируем логотипы обжарщиков, подождите...
                </p>
              </ActionDrawer.Content>
            </>
          )}
        </ActionDrawer.Switcher>
      </ActionDrawer>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
};

export default RoasterLogoImportExport;
