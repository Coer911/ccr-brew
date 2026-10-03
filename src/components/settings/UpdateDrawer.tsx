'use client';

import React from 'react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import ArrowUpIcon from '@public/images/icons/ui/arrow-up.svg';
import { openExternalUrl } from '@/lib/utils/openExternalUrl';

interface UpdateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  isAutoCheck?: boolean; // 是否为自动检测触发
  onPostpone?: () => void; // 点击"以后再说"的回调（7天后再提醒）
  mode?: 'native' | 'pwa';
  onPrimaryClick?: () => void;
  primaryText?: string;
  secondaryText?: string;
  primaryDisabled?: boolean;
  historyId?: string;
}

/**
 * 版本更新抽屉组件
 * 基于 ActionDrawer 构建，用于显示新版本信息并引导用户更新
 */
const UpdateDrawer: React.FC<UpdateDrawerProps> = ({
  isOpen,
  onClose,
  latestVersion,
  downloadUrl,
  releaseNotes,
  isAutoCheck = false,
  onPostpone,
  mode = 'native',
  onPrimaryClick,
  primaryText,
  secondaryText,
  primaryDisabled = false,
  historyId = 'update-drawer',
}) => {
  const isPWAMode = mode === 'pwa';

  const handlePrimaryAction = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
      return;
    }
    if (downloadUrl) {
      void openExternalUrl(downloadUrl);
    }
  };

  const handleSecondaryClick = () => {
    if (isAutoCheck && onPostpone) {
      onPostpone();
    }
    onClose();
  };

  return (
    <ActionDrawer isOpen={isOpen} onClose={onClose} historyId={historyId}>
      <ActionDrawer.Icon icon={ArrowUpIcon} />
      <ActionDrawer.Content>
        <p className="text-neutral-500 dark:text-neutral-400">
          {isPWAMode ? (
            <>Вышла новая версия, советуем обновиться.</>
          ) : (
            <>
              Вышла новая версия
              <span className="text-neutral-800 dark:text-neutral-200">
                {' '}
                v{latestVersion}
              </span>
              {releaseNotes ? (
                <>
                  , в этом обновлении
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {releaseNotes}
                  </span>
                  , советуем обновиться.
                </>
              ) : (
                <>, советуем обновиться.</>
              )}
            </>
          )}
        </p>
      </ActionDrawer.Content>

      <ActionDrawer.Actions>
        <ActionDrawer.SecondaryButton onClick={handleSecondaryClick}>
          {secondaryText ?? (isAutoCheck ? 'Потом' : 'Позже')}
        </ActionDrawer.SecondaryButton>
        <ActionDrawer.PrimaryButton
          onClick={handlePrimaryAction}
          disabled={primaryDisabled}
        >
          {primaryText ?? (isPWAMode ? 'Обновить сейчас' : 'Обновить')}
        </ActionDrawer.PrimaryButton>
      </ActionDrawer.Actions>
    </ActionDrawer>
  );
};

export default UpdateDrawer;
