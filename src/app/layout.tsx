import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { getSession, isAdmin } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Cultura Brew',
  description: 'Рецепты заваривания кофе Cultura Coffee',
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession().catch(() => null);
  return (
    <html lang="ru">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-dvh antialiased">
        <AuthBootstrap loggedIn={!!session} />
        <main className="mx-auto max-w-xl px-4 pb-28 pt-4">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 border-t border-card bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-xl justify-around py-2 text-sm">
            <Link href="/" className="px-3 py-2">☕ Кофе</Link>
            <Link href="/journal" className="px-3 py-2">📓 Журнал</Link>
            {isAdmin(session) && <Link href="/admin" className="px-3 py-2">⚙️ Админ</Link>}
          </div>
        </nav>
      </body>
    </html>
  );
}
