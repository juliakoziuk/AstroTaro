-- Карта дня: одна карта на людину на день, з якої рахується серія днів поспіль.
-- IF NOT EXISTS: міграція безпечна, якщо таблицю вже створила автосинхронізація (DB_SYNC=true) або запуск повторний.
CREATE TABLE IF NOT EXISTS daily_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day varchar(10) NOT NULL,
  "cardId" smallint NOT NULL,
  reversed boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS daily_cards_user_day ON daily_cards ("userId", day);
