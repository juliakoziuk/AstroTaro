-- Облік використання за тарифами (розклади, повідомлення ШІ) і подробиці підписки зі Stripe.
-- Події пишуться й тоді, коли автозбереження вимкнене: інакше ліміт обходився б вимкненням автозбереження.
-- IF NOT EXISTS: міграція безпечна, якщо таблицю чи колонки вже створила автосинхронізація (DB_SYNC=true) або запуск повторний.
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind varchar(32) NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_events_user_kind_created ON usage_events ("userId", kind, "createdAt");

ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionStatus" varchar(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "currentPeriodEnd" timestamptz;
