-- Публічне посилання на розклад (лише для читання): токен у посиланні, відкликається скиданням у NULL
ALTER TABLE spreads ADD COLUMN IF NOT EXISTS "shareToken" varchar(64);
ALTER TABLE spreads ADD COLUMN IF NOT EXISTS "sharedAt" timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS spreads_share_token ON spreads ("shareToken") WHERE "shareToken" IS NOT NULL;
