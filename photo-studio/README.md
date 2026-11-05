# Photo Studio — онлайн-бронювання фотостудії

Навчальний Angular-проєкт: клієнт обирає зал, дату й час та бронює; адмін керує записами.

## Запуск

Потрібні два термінали:

```bash
npm run api     # мок-бекенд json-server на http://localhost:3000 (дані з db.json)
```

```bash
npm start       # Angular на http://localhost:4200
```

> Пакети ставляться з `--legacy-peer-deps` (баг npm 11.2 з peer-залежностями).

## Структура

```
src/app/
  core/        моделі та сервіси (StudioService — всі запити до API)
  features/
    halls/     список залів            ← готово, зразок для решти
    booking/   форма бронювання        ← етапи 2–3
    admin/     адмін-панель            ← етапи 4–5
db.json        дані: halls, bookings
```

## Дорожня карта

| Етап | Завдання | Що вчиш |
|---|---|---|
| 1 | Список залів з API (**готово**) | компоненти, `@if` / `@for`, `HttpClient`, `toSignal`, Router |
| 2 | Сторінка бронювання: завантажити зал за `hallId`, обрати дату, показати зайняті/вільні години | `input()`, `signal` / `computed`, `switchMap`, pipes |
| 3 | Форма (ім'я, телефон, години) з валідацією, відправка `POST /bookings`, заборона перетину з існуючими бронюваннями | Reactive Forms, власні валідатори |
| 4 | Адмінка: таблиця записів, фільтр за датою й залом, підтвердити / скасувати (`PATCH`) | сервіси, фільтри на signals, стан списку |
| 5 | Логін адміна, захист `/admin` | guards, interceptor |
| 6 | Тижневий календар по залах | складніші компоненти, CDK |
| 7 | Анімації, тести, адаптив | `animate.enter/leave`, Vitest |

## API (json-server)

- `GET /halls`, `GET /halls/:id`
- `GET /bookings?hallId=1&date=2026-11-02`
- `POST /bookings`
- `PATCH /bookings/:id` — зміна статусу
