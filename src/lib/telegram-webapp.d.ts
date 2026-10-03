// Минимум того, что используем из Telegram.WebApp.
interface TelegramWebApp {
  initData: string;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  enableVerticalSwipes?(): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
}
interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
  onTelegramAuth?: (user: Record<string, string | number>) => void;
}
