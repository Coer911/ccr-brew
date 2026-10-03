'use client';

import React from 'react';
import { SettingsOptions } from './Settings';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import hapticsUtils from '@/lib/ui/haptics';
import { showToast } from '@/components/common/feedback/LightToast';
import SettingPage from './atomic/SettingPage';
import SettingSection from './atomic/SettingSection';
import SettingRow from './atomic/SettingRow';
import SettingToggle from './atomic/SettingToggle';
import {
  VIEW_LABELS,
  SIMPLIFIED_VIEW_LABELS,
  type ViewOption,
} from '@/components/coffee-bean/List/constants';
import { useModalHistory, modalHistory } from '@/lib/hooks/useModalHistory';
import {
  canDisableCoffeeBeanView,
  CONFIGURABLE_COFFEE_BEAN_VIEW_ORDER,
  canDisableMainNavigationTab,
  deriveNavigationSettings,
  getMainNavigationTabLabel,
  MAIN_NAVIGATION_TABS,
  mergeNavigationSettings,
  normalizeNavigationSettings,
  type MainNavigationTab,
} from '@/lib/navigation/navigationSettings';
import { makeDynamicSettingSearchId } from './settingsSearch';

interface NavigationSettingsProps {
  settings: SettingsOptions;
  onClose: () => void;
  handleChange: <K extends keyof SettingsOptions>(
    key: K,
    value: SettingsOptions[K]
  ) => void | Promise<void>;
}

const NavigationSettings: React.FC<NavigationSettingsProps> = ({
  settings: _settings,
  onClose,
  handleChange: _handleChange,
}) => {
  const settings = useSettingsStore(state => state.settings) as SettingsOptions;
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const updateNavigationSettings = useSettingsStore(
    state => state.updateNavigationSettings
  );

  const [isVisible, setIsVisible] = React.useState(false);

  // 用于保存最新的 onClose 引用
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 关闭处理函数（带动画）
  const handleCloseWithAnimation = React.useCallback(() => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('subSettingsClosing'));
    setTimeout(() => {
      onCloseRef.current();
    }, 350);
  }, []);

  // 使用统一的历史栈管理系统
  useModalHistory({
    id: 'navigation-settings',
    isOpen: true,
    onClose: handleCloseWithAnimation,
    skipPageExitTransitionOnHistory: true,
  });

  // UI 返回按钮点击处理
  const handleClose = () => {
    modalHistory.back();
  };

  // 处理显示/隐藏动画（入场动画）
  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  const derivedNavigation = React.useMemo(
    () => deriveNavigationSettings(settings.navigationSettings),
    [settings.navigationSettings]
  );

  const currentNavigation = React.useMemo(
    () => normalizeNavigationSettings(settings.navigationSettings),
    [settings.navigationSettings]
  );

  const commitNavigationSettings = React.useCallback(
    async (
      updates: Partial<NonNullable<SettingsOptions['navigationSettings']>>
    ) => {
      const nextNavigation = mergeNavigationSettings(
        currentNavigation,
        updates
      );

      if (
        deriveNavigationSettings(nextNavigation).renderedMainTabs.length === 0
      ) {
        showToast({ type: 'error', title: 'Должна остаться хотя бы одна функция' });
        return false;
      }

      await updateNavigationSettings(nextNavigation);

      if (settings.hapticFeedback) {
        hapticsUtils.light();
      }

      return true;
    },
    [currentNavigation, settings.hapticFeedback, updateNavigationSettings]
  );

  const handleMainTabToggle = (tab: MainNavigationTab) => {
    if (
      currentNavigation.visibleTabs[tab] &&
      !canDisableMainNavigationTab(settings.navigationSettings, tab)
    ) {
      showToast({ type: 'error', title: 'Должна остаться хотя бы одна функция' });
      return;
    }

    void commitNavigationSettings({
      visibleTabs: {
        ...currentNavigation.visibleTabs,
        [tab]: !currentNavigation.visibleTabs[tab],
      },
    });
  };

  const handleBeanViewToggle = (view: ViewOption) => {
    if (
      currentNavigation.coffeeBeanViews[view] &&
      !canDisableCoffeeBeanView(settings.navigationSettings, view)
    ) {
      showToast({ type: 'error', title: 'Должен остаться хотя бы один вид' });
      return;
    }

    void commitNavigationSettings({
      coffeeBeanViews: {
        ...currentNavigation.coffeeBeanViews,
        [view]: !currentNavigation.coffeeBeanViews[view],
      },
    });
  };

  const handlePinViewToggle = (view: ViewOption) => {
    const currentPinned = currentNavigation.pinnedViews as ViewOption[];
    let newPinned: ViewOption[];
    const isPinning = !currentPinned.includes(view); // 判断是固定还是取消固定

    if (currentPinned.includes(view)) {
      newPinned = currentPinned.filter(v => v !== view);
    } else {
      newPinned = [...currentPinned, view];
    }

    void commitNavigationSettings({
      pinnedViews: newPinned,
    }).then(success => {
      if (!success || !isPinning) {
        return;
      }

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('viewPinned', {
            detail: { pinnedView: view },
          })
        );
      }, 0);
    });
  };

  const getLabel = (view: ViewOption) => {
    return settings.simplifiedViewLabels
      ? SIMPLIFIED_VIEW_LABELS[view]
      : VIEW_LABELS[view];
  };

  const showCoffeeBeanViewSettings = derivedNavigation.visibleTabs.coffeeBean;

  return (
    <SettingPage title="Функции приложения" isVisible={isVisible} onClose={handleClose}>
      <SettingSection title="Отображение" className="-mt-4">
        <SettingRow label="Короткие подписи" isLast>
          <SettingToggle
            checked={settings.simplifiedViewLabels ?? false}
            onChange={checked =>
              void updateSettings({ simplifiedViewLabels: checked })
            }
          />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Включённые функции"
        footer="Выключенные функции скрываются, а процесс упрощается; хотя бы одна должна остаться"
      >
        {MAIN_NAVIGATION_TABS.map((tab, index) => (
          <SettingRow
            key={tab}
            settingId={makeDynamicSettingSearchId('navigation-tab', tab)}
            label={getMainNavigationTabLabel(
              tab,
              settings.simplifiedViewLabels
            )}
            isLast={index === MAIN_NAVIGATION_TABS.length - 1}
          >
            <SettingToggle
              checked={derivedNavigation.visibleTabs[tab]}
              disabled={
                currentNavigation.visibleTabs[tab] &&
                !canDisableMainNavigationTab(settings.navigationSettings, tab)
              }
              onChange={() => handleMainTabToggle(tab)}
            />
          </SettingRow>
        ))}
      </SettingSection>

      {showCoffeeBeanViewSettings &&
        CONFIGURABLE_COFFEE_BEAN_VIEW_ORDER.some(
          view => !derivedNavigation.pinnedViews.includes(view)
        ) && (
          <SettingSection
            title="Виды"
            footer="Какие виды показывать в меню на странице зерна"
          >
            {CONFIGURABLE_COFFEE_BEAN_VIEW_ORDER.filter(
              view => !derivedNavigation.pinnedViews.includes(view)
            ).map((view, index, array) => (
              <SettingRow
                key={view}
                settingId={makeDynamicSettingSearchId(
                  'navigation-view-display',
                  view
                )}
                label={getLabel(view)}
                isLast={index === array.length - 1}
              >
                <SettingToggle
                  checked={derivedNavigation.coffeeBeanViews[view] ?? true}
                  disabled={
                    derivedNavigation.coffeeBeanViews[view] &&
                    !canDisableCoffeeBeanView(settings.navigationSettings, view)
                  }
                  onChange={() => handleBeanViewToggle(view)}
                />
              </SettingRow>
            ))}
          </SettingSection>
        )}

      {showCoffeeBeanViewSettings && (
        <SettingSection
          title="Закреплённые виды"
          footer="Показывать частые виды отдельными вкладками в навигации"
        >
          {CONFIGURABLE_COFFEE_BEAN_VIEW_ORDER.map((view, index, array) => (
            <SettingRow
              key={view}
              settingId={makeDynamicSettingSearchId(
                'navigation-view-pin',
                view
              )}
              label={getLabel(view)}
              isLast={index === array.length - 1}
            >
              <SettingToggle
                checked={derivedNavigation.pinnedViews.includes(view)}
                onChange={() => handlePinViewToggle(view)}
              />
            </SettingRow>
          ))}
        </SettingSection>
      )}
    </SettingPage>
  );
};

export default NavigationSettings;
