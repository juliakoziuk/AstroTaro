# AstroTaro

## Структура репозиторію

- `client/` — фронтенд (React + Vite): `src/`, `public/`, HTML-входи, скрипти збірки плит і перевірок (`client/scripts/`).
- `server/` — API на NestJS (PostgreSQL через `docker-compose.yml`).
- `assets/` — вихідні зображення для скриптів збірки: `cards/`, `imgase/` (макети екранів), `reference/`, `design/`, `img.png`.
- Корінь: `npm run run:all` (клієнт + сервер разом), `npm run run:frontend`, `npm run run:backend`, `npm run build`, `npm test`, `npm run lint`.
  Команди клієнта (`i18n:check`, `app:*`, `landing:*`, `login:*`) запускайте з `client/`: `npm --prefix client run i18n:check`.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Мови інтерфейсу

Англійська й українська. Вибір: вкладка **Language** на екрані Settings, список Language у профілі, перемикач EN / УК на лендінгу, вході й реєстрації.
Мова зберігається в налаштуваннях акаунта (сервер) і застосовується до інтерфейсу, відповідей AI, карт і тлумачень.

- Словники: `src/i18n/uk.js` (ключ — англійський текст). Повнота: `npm run i18n:check`.
- Нова фраза в коді: `t('English text')` з `src/i18n/index.js`, потім переклад у словник української.
- Наскрізна перевірка: `node scripts/app/lang-flow.mjs`; знімки екранів: `LANG_ID=uk node scripts/app/shot.mjs all`.

## Налаштування

Сторінка `/settings` має адаптивну сітку та сім вкладок. Загальні параметри, сповіщення, тема й мова зберігаються в акаунті. Нагадування показуються всередині застосунку один раз на день на пристрої. Приватність керує доступом AI-компаньйона до снів, щоденника й розкладів.

Якщо автозбереження вимкнене, нові чати й розклади не записуються в базу. Поточний розклад тимчасово тримається в сесії вкладки; кнопка збереження додає його в історію вручну. Скидання параметрів не видаляє записи та дозволи AI. Експорт `/api/profile/export` повертає власні записи користувача без пароля й токенів.

Після змін серверних модулів потрібно перезапустити `npm run run:backend` (або `npm run run:all`): поточний сервер запускається без автоматичного перезавантаження. Перевірки: `npm test` (клієнт і сервер), `npm run build`, `npm --prefix client run i18n:check`.
