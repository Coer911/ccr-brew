'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useModalHistory, modalHistory } from '@/lib/hooks/useModalHistory';
import SettingPage from './atomic/SettingPage';
import {
  useSettingSearchHighlight,
  useScrollToHighlightedSetting,
} from './atomic';
import { makeSettingRowSearchId } from './settingsSearch';
import { handleExternalUrlClick } from '@/lib/utils/openExternalUrl';

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { highlightedSettingId } = useSettingSearchHighlight();
  const settingId = makeSettingRowSearchId(title);
  const isHighlighted = highlightedSettingId === settingId;
  const shouldShowContent = isOpen || isHighlighted;

  return (
    <div
      data-settings-search-id={settingId}
      className={`rounded transition-colors ${
        isHighlighted ? 'bg-neutral-200/70 dark:bg-neutral-700/45' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-1 select-none"
      >
        {shouldShowContent ? <Minus size={16} /> : <Plus size={16} />}
        {title}
      </button>
      <AnimatePresence>
        {shouldShowContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-4 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AboutSettingsProps {
  onClose: () => void;
}

const AboutSettings: React.FC<AboutSettingsProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  useScrollToHighlightedSetting();

  const handleCloseWithAnimation = React.useCallback(() => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('subSettingsClosing'));
    setTimeout(() => {
      onClose();
    }, 350);
  }, [onClose]);

  useModalHistory({
    id: 'about-settings',
    isOpen: true,
    onClose: handleCloseWithAnimation,
    skipPageExitTransitionOnHistory: true,
  });

  const handleClose = () => {
    modalHistory.back();
  };

  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  return (
    <SettingPage
      title="О приложении"
      isVisible={isVisible}
      onClose={handleClose}
    >
      <div className="px-6 pt-4 pb-6">
        <div className="space-y-4 text-base leading-relaxed font-medium">
          <p>
            Cultura Brew основан на открытом проекте Brew Guide (chu3), который
            появился из личной потребности и развивается при поддержке
            сообщества — это{' '}
            <span className="underline decoration-pink-500 decoration-wavy">
              проект на энтузиазме
            </span>
            .
          </p>
          <hr className="my-6" />
          <CollapsibleSection title="Политика конфиденциальности">
            <p>
              Приложение не использует веб-аналитику и сторонние сервисы
              статистики и не собирает данные о посещениях и устройствах.
            </p>
            <p>
              Всё зерно и записи заварок хранятся на вашем устройстве. Если
              включить облачную синхронизацию, данные синхронизируются с вашим
              собственным сервером (WebDAV/S3/Supabase) — приложение их не видит
              и не хранит.
            </p>
            <p>
              Распознавание по фото работает только через ИИ-сервис, который вы
              сами подключили в разделе «Эксперименты». Фото отправляется
              напрямую в этот сервис.
            </p>
          </CollapsibleSection>
          <CollapsibleSection title="Благодарности открытому ПО">
            <p>
              В проекте используется{' '}
              <a
                href="https://www.isocons.app/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalUrlClick}
                className="text-neutral-800 underline dark:text-neutral-200"
              >
                Isometric Icons
              </a>{' '}
              библиотека иконок по лицензии{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalUrlClick}
                className="text-neutral-800 underline dark:text-neutral-200"
              >
                CC BY 4.0
              </a>{' '}
              .
            </p>
          </CollapsibleSection>
          <CollapsibleSection title="Исходный код и лицензия">
            <p>
              Cultura Brew — модифицированная версия Brew Guide © 2026 chu3
              (chuthree), распространяется по лицензии GPL-3.0-only.
            </p>
            <p className="flex flex-col gap-1.5">
              <a
                href="https://github.com/chuthree/brew-guide"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalUrlClick}
                className="text-neutral-800 underline dark:text-neutral-200"
              >
                Исходный код оригинала (Brew Guide)
              </a>
              <a
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalUrlClick}
                className="text-neutral-800 underline dark:text-neutral-200"
              >
                Лицензия GPL-3.0
              </a>
            </p>
          </CollapsibleSection>
        </div>
      </div>
    </SettingPage>
  );
};

export default AboutSettings;
