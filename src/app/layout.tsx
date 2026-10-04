import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import localFont from 'next/font/local';
import { LightToast } from '@/components/common/feedback/LightToast';
import { ExitToast } from '@/components/common/feedback/ExitToast';
import '@/styles/base/globals.css';
import KeyboardManager from '@/components/layout/KeyboardManager';
import { Suspense } from 'react';
import CapacitorInit from '@/providers/CapacitorProvider';
import CrashDiagnosticsProvider from '@/providers/CrashDiagnosticsProvider';
import StorageInit from '@/providers/StorageProvider';
import ModalHistoryInit from '@/providers/ModalHistoryProvider';
import { DataLayerProvider } from '@/providers/DataLayerProvider';

import DevTools from '@/components/common/DevTools';
import TauriDragRegion from '@/components/layout/TauriDragRegion';
import PWAUpdatePrompt from '@/components/layout/PWAUpdatePrompt';

// 只加载需要的 GeistMono 字重（用于计时器）
const geistMono = localFont({
  src: [
    {
      path: '../styles/fonts/GeistMonoVF.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
});

const SEO_TITLE = 'Cultura Brew';
// Адрес сайта задаётся при сборке (NEXT_PUBLIC_SITE_URL). Без него абсолютные ссылки
// (canonical, Open Graph) не выводим, чтобы не публиковать чужой или выдуманный домен.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '') + '/'
  : null;
const SHARE_IMAGE_URL = SITE_URL
  ? SITE_URL + 'images/icons/app/icon-512x512-opaque.png'
  : null;

const encodeJsonForHtml = (value: unknown) =>
  JSON.stringify(value).replace(/[<>&]/g, char => {
    switch (char) {
      case '<':
        return '\\u003c';
      case '>':
        return '\\u003e';
      case '&':
        return '\\u0026';
      default:
        return char;
    }
  });

const STRUCTURED_DATA_JSON = encodeJsonForHtml({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cultura Brew',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, iOS, Android',
  ...(SITE_URL && { url: SITE_URL }),
  author: {
    '@type': 'Organization',
    name: 'Cultura Coffee',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'RUB',
  },
});

// SEO constants
export const metadata: Metadata = {
  ...(SITE_URL && { metadataBase: new URL(SITE_URL) }),
  title: SEO_TITLE,
  keywords: [
    'Cultura Brew',
    'таймер для кофе',
    'таймер для пуровера',
    'запасы кофе',
    'управление зерном',
    'учёт зерна',
    'записи заваривания',
    'кофейные заметки',
    'дегустационные заметки',
  ],
  manifest: '/manifest.json',
  ...(SITE_URL && { alternates: { canonical: SITE_URL } }),
  openGraph: {
    title: SEO_TITLE,
    ...(SITE_URL && { url: SITE_URL }),
    siteName: 'Cultura Brew',
    locale: 'ru_RU',
    type: 'website',
    ...(SHARE_IMAGE_URL && {
      images: [
        {
          url: SHARE_IMAGE_URL,
          width: 512,
          height: 512,
          alt: 'Cultura Brew',
        },
      ],
    }),
  },
  twitter: {
    card: SHARE_IMAGE_URL ? 'summary_large_image' : 'summary',
    title: SEO_TITLE,
    ...(SHARE_IMAGE_URL && { images: [SHARE_IMAGE_URL] }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/images/icons/app/favicon.ico', sizes: 'any' },
      {
        url: '/images/icons/app/icon-192x192-contained.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/images/icons/app/icon-512x512-contained.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcut: '/images/icons/app/favicon.ico',
    apple: '/images/icons/app/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/images/icons/app/apple-touch-icon.png',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cultura Brew',
  },
  verification: {
    google: null,
    yandex: null,
    yahoo: null,
    other: {
      baidu: '1d5ab7c4016b8737328359797bfaac08',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 确定当前环境
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={geistMono.variable}
      style={
        {
          // 正文字体：优先使用系统 UI 字体
          '--font-sans': `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif`,
          // 计时器/数字字体：等宽字体保证对齐
          '--font-timer':
            'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          // 系统数字字体（可选）：用于表格、价格等
          '--font-numeric': 'ui-rounded, "SF Pro Rounded", system-ui',
        } as React.CSSProperties
      }
    >
      <head>
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {/* JSON-LD 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: STRUCTURED_DATA_JSON,
          }}
        />
        <meta name="application-name" content="Cultura Brew" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Cultura Brew" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link
          rel="apple-touch-startup-image"
          href="/images/icons/app/icon-512x512-opaque.png"
        />
        <link
          rel="apple-touch-icon"
          href="/images/icons/app/apple-touch-icon.png"
        />
        <link rel="icon" href="/images/icons/app/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        {/* theme-color 由客户端 useThemeColor hook 动态管理，避免 RSC 静态标签覆盖 */}
        {/* 字体缩放初始化脚本 - 必须在页面渲染前执行，避免字体闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedZoom = localStorage.getItem('fontZoomLevel');
                  if (savedZoom) {
                    const zoomLevel = parseFloat(savedZoom);
                    if (!isNaN(zoomLevel) && zoomLevel >= 0.8 && zoomLevel <= 1.4) {
                      document.documentElement.style.setProperty('--font-scale', zoomLevel.toString());
                    }
                  }
                } catch (e) {
                  // 静默处理错误
                }
              })();
            `,
          }}
        />
        {isDevelopment && (
          <>
            <meta
              httpEquiv="Cache-Control"
              content="no-cache, no-store, must-revalidate"
            />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
          </>
        )}
      </head>
      <body className="select-none [&_[contenteditable]]:select-text [&_input]:select-text [&_textarea]:select-text">
        <h1 className="sr-only">Cultura Brew</h1>
        <noscript>
          <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Cultura Brew</h1>
          </div>
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
        >
          <DataLayerProvider>
            <TauriDragRegion />
            <DevTools />
            <div className="h-dvh overflow-hidden bg-neutral-50 dark:bg-neutral-900">
              <Suspense>
                <CrashDiagnosticsProvider />
                <CapacitorInit />
                <StorageInit />
                <ModalHistoryInit />
                <KeyboardManager />
              </Suspense>
              <div className="mx-auto flex h-full w-full flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
              </div>
              {!isDevelopment && <PWAUpdatePrompt />}
              <LightToast />
              <ExitToast />
            </div>
          </DataLayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
