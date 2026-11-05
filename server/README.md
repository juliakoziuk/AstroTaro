# AstroTarot API (NestJS + Sequelize + PostgreSQL)

```bash
cd server && npm install --legacy-peer-deps   # swagger очікує TypeScript 5–6, у проєкті 7
npm run start:dev      # збірка tsc + node dist/main.js → http://localhost:3000/api
npm test               # юніт-тести чистої логіки (таро, сни, астрологія, прогрес)
node scripts/smoke.mjs # наскрізна перевірка всіх ендпоїнтів проти запущеного сервера
```

Swagger: http://localhost:3000/api/docs. Налаштування — у `server/.env` (зразок: `.env.example`); база — PostgreSQL `AstroTarot`.
Таблиці створюються з моделей (`synchronize` + `alter`), перед продакшеном потрібні міграції.
**AI-компаньйон.** Відповідь генерує модель з контекстом про людину (профіль, натальна карта, поточне небо, останні сни, розклад, настрій щоденника): `ANTHROPIC_API_KEY` (Claude) або будь-який OpenAI-сумісний сервіс (`LLM_BASE_URL` + `LLM_MODEL`, зокрема Ollama локально безкоштовно). Без моделі, або якщо вона збоїть, відповідає локальний асистент (розпізнає тему повідомлення, пам'ятає тему розмови, не повторюється, реагує на кризові повідомлення контактами допомоги). Відповідь чату містить `source: "ai" | "local"`. Перевірка моделі: `node --env-file=.env scripts/llm-check.mjs`.

Зовнішні API (модуль `cosmos`, усі через сервер із кешем і таймаутом): Nominatim (пошук міста), NASA APOD (`NASA_API_KEY`; публічний DEMO_KEY — лише 10 запитів/год),
ZenQuotes (цитата дня; потрібне посилання на zenquotes.io), sunrise-sunset.org, Nager.Date (свята країни), Met Museum (картини до символів снів, суспільне надбання).
Часові пояси: tz-lookup (координати → зона) + ICU для історичного літнього часу, тож місцевий час народження правильно переводиться в UTC для натальної карти.

Мови (en, uk, es): клієнт шле заголовок Accept-Language, і сервер віддає все мовою інтерфейсу: назви й тлумачення карт, розклади, трактовку снів, астрологію, відповіді AI-компаньйона (Claude отримує підказку «answer in …»), тарифи, помилки й валідацію.
У базі лежать нейтральні дані (id карт, текст сну), а переклад робиться у відповіді, тож зміна мови перекладає й старі розклади та сни. Мова запиту доступна коду через `currentLocale()` (src/i18n/locale.ts).
Тексти довідників: tarot/cards.ts, tarot/readings.ts, dreams/analysis.ts, astrology/text.ts, companion/reply.ts, plans/plans.ts, i18n/messages.ts.

Модулі за екранами: `auth` (реєстрація, вхід), `dashboard`, `plans` (+ `/billing/plan`), `tarot` (розклади, колоди, витягування карт), `spreads` (історія й «збережені»),
`dreams` (CRUD + автотрактовка), `journal`, `astrology` (натальна карта на astronomy-engine, транзити, фази Місяця, звіти), `companion` + `messages`, `profile` (+ `/settings`).
