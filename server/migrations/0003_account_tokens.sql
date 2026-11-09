-- Скидання пароля й підтвердження пошти. У базі лежать лише SHA-256 хеші одноразових токенів (самі токени є тільки в листі).
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerifyHash" varchar(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetHash" varchar(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetExpires" timestamptz;
-- токени входу, видані раніше за цю мить, більше недійсні (змінили пароль)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordChangedAt" timestamptz;
CREATE INDEX IF NOT EXISTS users_password_reset_hash ON users ("passwordResetHash") WHERE "passwordResetHash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_email_verify_hash ON users ("emailVerifyHash") WHERE "emailVerifyHash" IS NOT NULL;
