'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Вход в обычном браузере. Нужен /setdomain у @BotFather на домен приложения. */
export function LoginWidget({ botUsername }: { botUsername: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [inTelegram, setInTelegram] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) { setInTelegram(true); return; }
    window.onTelegramAuth = async (user) => {
      const r = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ widget: user }),
        credentials: 'include',
      });
      if (r.ok) router.refresh(); else setError(true);
    };
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', botUsername);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '12');
    s.setAttribute('data-onauth', 'onTelegramAuth(user)');
    s.setAttribute('data-request-access', 'write');
    ref.current?.appendChild(s);
    return () => { delete window.onTelegramAuth; };
  }, [botUsername, router]);

  if (inTelegram) return <p className="text-sm text-muted">Входим через Telegram…</p>;
  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} />
      <a className="text-sm underline text-muted" href={`https://t.me/${botUsername}?start=web`}>
        или откройте приложение в Telegram
      </a>
      {error && <p className="text-sm text-danger">Не получилось войти, попробуйте ещё раз.</p>}
    </div>
  );
}
