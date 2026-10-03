'use client';

import React from 'react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import DataInfoAlertIcon from '@public/images/icons/ui/data-info-alert.svg';

export interface ConvertToGreenPreview {
  beanId: string;
  beanName: string;
  originalBean: { capacity: number; remaining: number };
  greenBean: { capacity: number; remaining: number };
  roastingAmount: number;
  newRoastedBean: { capacity: number; remaining: number };
  brewingNotesCount: number;
  noteUsageTotal: number;
  recordsToDeleteCount: number;
  directConvert?: boolean;
}

interface ConvertToGreenDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  preview: ConvertToGreenPreview | null;
  /** 退出动画完成后的回调，适合在此时机清理数据 */
  onExitComplete?: () => void;
}

/**
 * 转生豆确认抽屉组件
 * 基于 ActionDrawer 构建，用于熟豆转生豆操作的确认
 */
const ConvertToGreenDrawer: React.FC<ConvertToGreenDrawerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  preview,
  onExitComplete,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={onClose}
      historyId="convert-to-green-drawer"
      onExitComplete={onExitComplete}
    >
      <ActionDrawer.Icon icon={DataInfoAlertIcon} />
      <ActionDrawer.Content>
        {preview && (
          <p className="text-neutral-500 dark:text-neutral-400">
            {preview.directConvert ? (
              <>
                Перевести
                <span className="text-neutral-800 dark:text-neutral-200">
                  「{preview.beanName}」
                </span>
                в зелёное зерно; исходное обжаренное
                <span className="text-neutral-800 dark:text-neutral-200">
                  {' '}
                  {preview.originalBean.capacity}g{' '}
                </span>
                ещё не использовалось и целиком станет
                <span className="text-neutral-800 dark:text-neutral-200">
                  {' '}
                  {preview.greenBean.capacity}g{' '}
                </span>
                зелёным зерном.
              </>
            ) : (
              <>
                Перевести
                <span className="text-neutral-800 dark:text-neutral-200">
                  「{preview.beanName}」
                </span>
                в зелёное зерно; исходное обжаренное
                <span className="text-neutral-800 dark:text-neutral-200">
                  {' '}
                  {preview.originalBean.capacity}g{' '}
                </span>
                всего,
                <span className="text-neutral-800 dark:text-neutral-200">
                  {preview.originalBean.remaining}g{' '}
                </span>
                осталось — будет разделено на
                <span className="text-neutral-800 dark:text-neutral-200">
                  {' '}
                  {preview.greenBean.capacity}g{' '}
                </span>
                зелёного зерна и
                <span className="text-neutral-800 dark:text-neutral-200">
                  {' '}
                  {preview.newRoastedBean.capacity}g{' '}
                </span>
                нового обжаренного.
                {preview.brewingNotesCount > 0 && (
                  <>
                    Будут перенесены
                    <span className="text-neutral-800 dark:text-neutral-200">
                      {' '}
                      {preview.brewingNotesCount}{' '}
                    </span>
                    записей заваривания в новое обжаренное зерно.
                  </>
                )}
                {preview.recordsToDeleteCount > 0 && (
                  <>
                    Также удалится
                    <span className="text-neutral-800 dark:text-neutral-200">
                      {' '}
                      {preview.recordsToDeleteCount}{' '}
                    </span>
                    записей об изменениях.
                  </>
                )}
              </>
            )}
          </p>
        )}
      </ActionDrawer.Content>
      <ActionDrawer.Actions>
        <ActionDrawer.SecondaryButton onClick={onClose}>
          Отмена
        </ActionDrawer.SecondaryButton>
        <ActionDrawer.PrimaryButton onClick={handleConfirm}>
          Перевести
        </ActionDrawer.PrimaryButton>
      </ActionDrawer.Actions>
    </ActionDrawer>
  );
};

export default ConvertToGreenDrawer;
