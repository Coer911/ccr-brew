# Cultura Brew — архитектура MVP

Онлайн-приложение с рецептами заваривания кофе Cultura Coffee.
Открывается как **Telegram Mini App** из отдельного бота, вход только через Telegram.
Референс по идеям — [chuthree/brew-guide](https://github.com/chuthree/brew-guide)
(GPL-3.0: берём идеи и модель данных, **код не копируем**).

## 1. MVP

| Входит | Не входит (потом) |
|---|---|
| Вход через Telegram (Mini App + виджет на сайте) | QR и коды с упаковки |
| Каталог ~10 кофе | Чай |
| 1–3 рецепта на кофе | Советник «мельче/крупнее» |
| Таймер-гид по этапам | Статистика, уведомления от бота |
| Оценка и журнал заварок | «Купить снова» |
| Админка каталога и рецептов | |

Язык интерфейса — только русский.

## 2. Схема

```
Пользователь ─► Telegram ─► @cultura_brew_bot (кнопка «Открыть»)
                                    │ Mini App (WebView)
                                    ▼
             Dockhost: контейнер brew (Next.js, порт 3000)
               ├─ страницы (React)          — каталог, рецепт, таймер, журнал, админка
               ├─ /api/auth/telegram        — проверка initData, выдача сессии
               ├─ /api/bot/webhook          — вебхук бота (/start → кнопка Mini App)
               └─ server actions            — чтение/запись в БД
                                    │
                                    ▼
             Postgres (тот же, что у superbot), таблицы brew_*
```

Один контейнер: фронт, API и вебхук бота. Отдельный сервис для бота в MVP не нужен.

## 3. Стек

| Слой | Выбор | Почему |
|---|---|---|
| Фреймворк | Next.js (App Router) + TypeScript | как у референса; фронт и API в одном |
| UI | Tailwind CSS | как у референса, mobile-first |
| БД | PostgreSQL + Drizzle ORM | Postgres уже есть; Drizzle — типы и миграции |
| Бот | grammY (webhook) | лёгкий, TypeScript |
| Mini App SDK | `@telegram-apps/sdk` или `window.Telegram.WebApp` | тема, haptic, кнопки |
| Хостинг | Dockhost, Docker, бесплатный домен `*.dockhost.net` | уже используется |

Референс работает local-first (Dexie/IndexedDB + синхронизация). Нам это не нужно:
данные на сервере, офлайн — позже через PWA-кеш каталога.

## 4. Вход через Telegram — главное

### Mini App (основной)
1. Клиент берёт `Telegram.WebApp.initData` и шлёт `POST /api/auth/telegram`.
2. Сервер проверяет подпись:
   `secret = HMAC_SHA256(key="WebAppData", BOT_TOKEN)`,
   `hash == HMAC_SHA256(key=secret, data_check_string)`.
3. Проверяет свежесть `auth_date` (не старше 24 ч).
4. `upsert brew_users` по `telegram_id`.
5. Выдаёт сессию: подписанный JWT в cookie `httpOnly; Secure; SameSite=None`
   (None — потому что WebView Telegram открывает сайт во фрейме на части клиентов).

### Login Widget (запасной, для браузера)
Та же схема, но `secret = SHA256(BOT_TOKEN)`. Домен задаётся в @BotFather → `/setdomain`.

### Правила
- `BOT_TOKEN` и `SESSION_SECRET` — **только на сервере**, только в env Dockhost.
- Браузеру не верим никогда: `user_id` берётся только из сессии.
- Админ — `telegram_id` из `ADMIN_TELEGRAM_IDS`.

## 5. Модель данных

Идея из референса: **рецепт = параметры + список этапов** (`MethodParams.stages`).
Один движок таймера подходит для любого способа; чай потом ляжет в ту же модель.

```
brew_users      id, telegram_id UNIQUE, first_name, username, photo_url,
                is_admin, created_at, last_seen_at

brew_products   id, slug UNIQUE, type ('coffee'), name, description,
                origin, process, variety, roast_level, flavor_notes text[],
                image_url, code NULL UNIQUE,   -- задел под QR/код с пачки
                sort_order, is_published, updated_at

brew_recipes    id, product_id → brew_products, method
                ('v60'|'kalita'|'french_press'|'aeropress'|'espresso'|...),
                title, dose_g, water_g, ratio, temp_c, grind_text,
                total_time_s, is_published, sort_order

brew_recipe_steps id, recipe_id → brew_recipes, position,
                kind ('pour'|'wait'|'stir'|'press'),
                target_water_g NULL,   -- сколько воды должно быть к концу этапа
                duration_s,            -- длительность этапа
                label, hint

brew_brews      id, user_id → brew_users, recipe_id → brew_recipes,
                product_id, started_at, actual_time_s,
                rating 1..5, taste text[], note,
                params jsonb           -- снимок параметров рецепта на момент заварки
```

Почему так:
- `duration_s` вместо накопительного времени — в референсе была миграция
  `time → duration` (`stageMigration.ts`); сразу делаем как у них сейчас.
- `params jsonb` в заварке — если рецепт потом поправят, история не «поедет».
- `code` и `type` — копеечный задел под QR и чай.
- Префикс `brew_` — делим базу с superbot без конфликтов.

## 6. Таймер-гид

По мотивам `components/brewing/Timer` референса (TimerController / StageProcessor / Audio):

```
TimerController   start / pause / resume / reset; состояние = startedAt + pausedTotal
StageProcessor    по elapsed → текущий этап, прогресс этапа, сколько воды должно быть
Feedback          звук + Telegram HapticFeedback на смене этапа, за 3 с до конца
```

Правила:
- `elapsed = now - startedAt - pausedTotal`. **Не** `seconds++` в `setInterval`:
  в фоне и на слабых телефонах счётчик отстаёт.
- Wake Lock API — экран не гаснет; Mini App: `disableVerticalSwipes()`,
  чтобы свайп не закрыл приложение посреди заварки.
- Логика таймера — чистые функции без React, покрыты тестами.

## 7. Экраны

```
/                 каталог (карточки кофе)
/coffee/[slug]    кофе: описание, ноты, список рецептов
/brew/[recipeId]  параметры → «Начать» → таймер → оценка
/journal          мои заварки
/admin            кофе и рецепты (только ADMIN_TELEGRAM_IDS)
```

Deep link: `t.me/<bot>?startapp=<slug>` → сразу открывает нужный кофе.
Это же будущий QR: его можно печатать без доработок.

## 8. Структура репозитория `ccr-brew`

```
ccr-brew/
├─ src/
│  ├─ app/                    страницы и /api
│  ├─ components/             catalog/, recipe/, timer/, journal/, admin/, ui/
│  ├─ lib/
│  │  ├─ auth/                telegram.ts (проверка подписи), session.ts
│  │  ├─ db/                  schema.ts (Drizzle), client.ts
│  │  ├─ timer/               controller.ts, stages.ts (+ тесты)
│  │  └─ bot/                 grammY: /start → кнопка Mini App
│  └─ styles/
├─ drizzle/                   миграции
├─ seed/                      products.json, recipes.json — ваш контент
├─ Dockerfile                 next build → standalone
├─ dockhost.yaml
└─ .env.example
```

## 9. Конфигурация (env Dockhost)

| Переменная | Назначение |
|---|---|
| `BOT_TOKEN` | токен отдельного бота |
| `BOT_WEBHOOK_SECRET` | проверка запросов Telegram к `/api/bot/webhook` |
| `SESSION_SECRET` | подпись JWT-сессий |
| `DATABASE_URL` | Postgres |
| `ADMIN_TELEGRAM_IDS` | через запятую |
| `PUBLIC_URL` | бесплатный домен Dockhost (https) |

`/api/health` — 200 при полной конфигурации, иначе 503 со списком `missing`
(как у superbot).

## 10. Безопасность и данные

- Все запросы к `brew_brews` фильтруются по `user_id` из сессии.
- Админские action'ы проверяют `is_admin` на сервере.
- Telegram ID и имя — персональные данные (152-ФЗ): Dockhost размещён в РФ;
  нужна короткая политика конфиденциальности, ссылка в боте и в приложении.

## 11. План работ

1. Скелет: Next.js, Drizzle-схема, миграции, Dockerfile, деплой «hello» на Dockhost.
2. Бот + вход через Telegram + сессия.
3. Каталог и страница кофе из seed.
4. Таймер-гид (движок + UI).
5. Оценка и журнал.
6. Админка.
7. Наполнение контентом, тест на телефонах (iOS/Android Telegram).
