# Cultura Brew

Рецепты заваривания кофе Cultura Coffee. Открывается как Telegram Mini App
из бота **@Brewing_ccrbot**, вход только через Telegram. Архитектура —
[ARCHITECTURE.md](ARCHITECTURE.md).

## Что умеет (MVP)

| Экран | Адрес |
|---|---|
| Каталог кофе | `/` |
| Кофе: описание и рецепты | `/coffee/<slug>` |
| Рецепт → таймер-гид → оценка | `/brew/<id>` |
| Мой журнал заварок | `/journal` |
| Админка каталога и рецептов (только `ADMIN_TELEGRAM_IDS`) | `/admin` |

Ссылка сразу на кофе из Telegram: `https://t.me/Brewing_ccrbot?start=<slug>`.

## Запуск на Dockhost

1. **Env проекта** (секреты, не в git):

   | Переменная | Что это |
   |---|---|
   | `BOT_TOKEN` | токен @Brewing_ccrbot из @BotFather |
   | `BOT_WEBHOOK_SECRET` | любая случайная строка |
   | `SESSION_SECRET` | случайная строка ≥ 32 символов (`openssl rand -hex 32`) |
   | `DATABASE_URL` | Postgres; можно тот же, что у superbot — таблицы `brew_*` |
   | `PUBLIC_URL` | https-домен, который Dockhost выдал контейнеру `brew` |

2. Сборка и выкладка:
   ```bash
   dockhost repository build --name brew --project ccr-brew
   # подставить полный Git SHA образа в dockhost.yaml → containers.brew.image
   dockhost compose apply ./dockhost.yaml
   ```
3. При старте сервер сам: применяет миграции, заливает демо-каталог (если пусто),
   ставит вебхук бота и кнопку меню «Рецепты».
4. Проверка: `https://<домен>/api/health` → `{"ok":true,"db":"up","missing":[]}`.
   Если 503 — в `missing` видно, чего не хватает.
5. Для входа в обычном браузере: @BotFather → бот → **Login Widget** (`/setdomain`) → домен приложения.
   Внутри Telegram это не нужно.

## Контент

Каталог правится в `/admin` (откройте приложение из Telegram под админским ID).
Демо-кофе помечены «(демо)» — замените или удалите.

Этапы рецепта пишутся строками:

```
действие | секунд | вода к концу этапа, г | название | подсказка
налить   | 15     | 40                    | Блуминг  | Смочите весь кофе
ждать    | 30     |                       | Ждём
налить   | 30     | 250                   | Основной пролив
помешать | 5      |                       | Покачать воронку
```

Действия: `налить`, `ждать`, `помешать`, `прессовать`. Вода в «налить» — сколько
всего воды должно быть к концу этапа, а не сколько долить.

## Разработка

```bash
pnpm install
cp .env.example .env.local     # DATABASE_URL на локальный Postgres
pnpm dev
pnpm test                      # движок таймера, проверка подписи Telegram, формат этапов
pnpm typecheck
pnpm db:generate               # после правки src/lib/db/schema.ts — новая миграция
```

## Устройство

```
src/
├─ app/                 страницы, server actions, /api (auth, bot webhook, health)
├─ components/          BrewSession (таймер + оценка), LoginWidget, admin/Forms
├─ lib/
│  ├─ auth/             telegram.ts — проверка initData/виджета; session.ts — JWT-кука
│  ├─ db/               schema.ts (Drizzle), queries.ts, bootstrap.ts (миграции + сид)
│  ├─ timer/stages.ts   движок таймера: чистые функции, время от Date.now
│  ├─ bot/bot.ts        grammY: /start → кнопка Mini App
│  └─ steps-text.ts     текстовый формат этапов для админки
├─ seed/catalog.ts      демо-каталог
└─ instrumentation.ts   старт: миграции, сид, настройка бота
```
