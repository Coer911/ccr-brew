'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Внутри Telegram входит сам: отдаёт initData серверу на проверку. */
export function AuthBootstrap({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    if (!wa) return;
    wa.ready();
    wa.expand();
    if (loggedIn || !wa.initData) return;
    fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: wa.initData }),
      credentials: 'include',
    }).then((r) => { if (r.ok) router.refresh(); });
  }, [loggedIn, router]);

  return null;
}
