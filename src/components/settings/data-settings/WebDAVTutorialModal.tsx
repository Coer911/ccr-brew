'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import ActionDrawer from '@/components/common/ui/ActionDrawer';
import { showToast } from '@/components/common/feedback/LightToast';
import { useModalHistory } from '@/lib/hooks/useModalHistory';
import { WebDAVSyncManager } from '@/lib/webdav/syncManager';
import { handleExternalUrlClick } from '@/lib/utils/openExternalUrl';

// 图标导入
import Download2Icon from '@public/images/icons/ui/download-2.svg';
import DensityMediumIcon from '@public/images/icons/ui/density-medium.svg';
import BottomRightClickIcon from '@public/images/icons/ui/bottom-right-click.svg';
import DataTableIcon from '@public/images/icons/ui/data-table.svg';
import CheerIcon from '@public/images/icons/ui/cheer.svg';

// 步骤类型定义：介绍 -> 下载 -> 注册 -> 填写 -> 完成
type TutorialStep = 'intro' | 'download' | 'register' | 'config' | 'complete';

interface WebDAVTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: {
    url: string;
    username: string;
    password: string;
  }) => void;
}

const WebDAVTutorialModal: React.FC<WebDAVTutorialModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  // 当前步骤
  const [currentStep, setCurrentStep] = useState<TutorialStep>('intro');
  // 表单数据
  const [formData, setFormData] = useState({
    url: 'https://dav.jianguoyun.com/dav/',
    username: '',
    password: '',
  });
  // 连接测试状态
  const [isConnecting, setIsConnecting] = useState(false);
  // 显示密码
  const [showPassword, setShowPassword] = useState(false);

  // 返回上一步
  const goBack = useCallback(() => {
    if (currentStep === 'complete') {
      setCurrentStep('config');
    } else if (currentStep === 'config') {
      setCurrentStep('register');
    } else if (currentStep === 'register') {
      setCurrentStep('download');
    } else if (currentStep === 'download') {
      setCurrentStep('intro');
    }
  }, [currentStep]);

  // 使用 modalHistory 管理非首步的返回行为
  useModalHistory({
    id: 'webdav-tutorial-step',
    isOpen: isOpen && currentStep !== 'intro',
    onClose: goBack,
  });

  // 重置状态
  const handleClose = useCallback(() => {
    setCurrentStep('intro');
    setFormData({
      url: 'https://dav.jianguoyun.com/dav/',
      username: '',
      password: '',
    });
    setIsConnecting(false);
    onClose();
  }, [onClose]);

  // 进入下一步
  const goToNextStep = useCallback(() => {
    if (currentStep === 'intro') {
      setCurrentStep('download');
    } else if (currentStep === 'download') {
      setCurrentStep('register');
    } else if (currentStep === 'register') {
      setCurrentStep('config');
    } else if (currentStep === 'config') {
      setCurrentStep('complete');
    }
  }, [currentStep]);

  // 测试连接
  const testConnection = useCallback(async () => {
    if (!formData.url || !formData.username || !formData.password) {
      showToast({ type: 'error', title: 'Заполните все настройки' });
      return;
    }

    setIsConnecting(true);

    try {
      const manager = new WebDAVSyncManager();
      const connected = await manager.initialize({
        url: formData.url,
        username: formData.username,
        password: formData.password,
        remotePath: '',
      });

      if (connected) {
        // 测试成功后直接回调并进入完成步骤
        onComplete({
          url: formData.url,
          username: formData.username,
          password: formData.password,
        });
        goToNextStep();
      } else {
        showToast({ type: 'error', title: 'Ошибка подключения, проверьте настройки' });
      }
    } catch (error) {
      console.error('WebDAV 连接测试失败:', error);
      showToast({
        type: 'error',
        title: error instanceof Error ? error.message : 'Ошибка подключения',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [formData, goToNextStep, onComplete]);

  // 介绍步骤内容
  const introContent = (
    <>
      <div className="mb-6 text-neutral-800 dark:text-neutral-200">
        <DensityMediumIcon width={128} height={128} />
      </div>
      <ActionDrawer.Content>
        <p className="text-neutral-500 dark:text-neutral-400">
          Всего
          <span className="text-neutral-800 dark:text-neutral-200">
            {' '}
            три простых шага
          </span>
          — и облачная синхронизация включена. Ваши кофейные данные будут одинаковыми на всех устройствах.
        </p>
      </ActionDrawer.Content>
      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={goToNextStep}
          className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Начать настройку
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleClose}
          className="w-full rounded-full bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          Потом
        </motion.button>
      </div>
    </>
  );

  // 下载步骤内容
  const downloadContent = (
    <>
      <div className="mb-6 text-neutral-800 dark:text-neutral-200">
        <Download2Icon width={128} height={128} />
      </div>
      <ActionDrawer.Content>
        <p className="text-neutral-500 dark:text-neutral-400">
          Заведите
          <a
            href="https://www.jianguoyun.com/s/downloads"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalUrlClick}
            className="text-neutral-800 underline dark:text-neutral-200"
          >
            {' '}
            Яндекс Диск
          </a>
          . Это облачное хранилище с поддержкой WebDAV, стабильное и надёжное.
        </p>
      </ActionDrawer.Content>
      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={goToNextStep}
          className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Готово, дальше
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={goBack}
          className="w-full rounded-full bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          Назад
        </motion.button>
      </div>
    </>
  );

  // 注册步骤内容
  const registerContent = (
    <>
      <div className="mb-6 text-neutral-800 dark:text-neutral-200">
        <BottomRightClickIcon width={128} height={128} />
      </div>
      <ActionDrawer.Content>
        <div className="space-y-3">
          <p className="text-neutral-500 dark:text-neutral-400">
            Откройте Яндекс ID и
            <span className="text-neutral-800 dark:text-neutral-200">
              {' '}
              войдите в аккаунт
            </span>
            . В разделе
            <span className="text-neutral-800 dark:text-neutral-200">
              {' '}
              Безопасность → Пароли приложений
            </span>{' '}
            создайте пароль для Диска с названием
            <span className="text-neutral-800 dark:text-neutral-200">
              {' '}
              Cultura Brew
            </span>
            。
          </p>
        </div>
      </ActionDrawer.Content>
      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={goToNextStep}
          className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Пароль приложения создан, дальше
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={goBack}
          className="w-full rounded-full bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          Назад
        </motion.button>
      </div>
    </>
  );

  // 配置步骤内容
  const configContent = (
    <>
      <div className="mb-6 text-neutral-800 dark:text-neutral-200">
        <DataTableIcon width={128} height={128} />
      </div>
      <ActionDrawer.Content>
        <p className="text-neutral-500 dark:text-neutral-400">
          Введите логин Яндекса
          <span className="text-neutral-800 dark:text-neutral-200">
            {' '}
            и пароль приложения
          </span>{' '}
          из раздела «Пароли приложений».
        </p>
      </ActionDrawer.Content>
      <div className="flex flex-col gap-2">
        {/* 配置表单 */}
        <div className="mb-2 space-y-3">
          {/* 服务器地址 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Адрес сервера
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={e =>
                setFormData(prev => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://dav.jianguoyun.com/dav/"
              className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-300 focus:outline-none dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
            />
          </div>

          {/* 账号 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Логин
            </label>
            <input
              type="email"
              value={formData.username}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Логин Яндекса"
              autoComplete="email"
              className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-300 focus:outline-none dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
            />
          </div>

          {/* 应用密码 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Пароль приложения
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Пароль приложения Яндекса"
                autoComplete="current-password"
                className="w-full rounded-2xl bg-neutral-100 px-4 py-3 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-300 focus:outline-none dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 transform p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={goBack}
            className="flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            Назад
          </motion.button>
          <motion.button
            whileTap={
              !formData.username || !formData.password || isConnecting
                ? undefined
                : { scale: 0.98 }
            }
            onClick={testConnection}
            disabled={!formData.username || !formData.password || isConnecting}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition-colors ${
              formData.username && formData.password && !isConnecting
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
            }`}
          >
            {isConnecting ? 'Подключаемся...' : 'Проверить подключение'}
          </motion.button>
        </div>
      </div>
    </>
  );

  // 完成步骤内容
  const completeContent = (
    <>
      <div className="mb-6 text-neutral-800 dark:text-neutral-200">
        <CheerIcon width={128} height={128} />
      </div>
      <ActionDrawer.Content>
        <p className="text-neutral-500 dark:text-neutral-400">
          <span className="text-neutral-800 dark:text-neutral-200">
            Всё готово.
          </span>
          Облачная синхронизация настроена, загружайте и скачивайте данные когда угодно.
        </p>
      </ActionDrawer.Content>
      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleClose}
          className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Готово
        </motion.button>
      </div>
    </>
  );

  // 根据当前步骤获取内容
  const getStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return introContent;
      case 'download':
        return downloadContent;
      case 'register':
        return registerContent;
      case 'config':
        return configContent;
      case 'complete':
        return completeContent;
    }
  };

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={handleClose}
      historyId="webdav-tutorial"
    >
      <ActionDrawer.Switcher activeKey={currentStep}>
        {getStepContent()}
      </ActionDrawer.Switcher>
    </ActionDrawer>
  );
};

export default WebDAVTutorialModal;
