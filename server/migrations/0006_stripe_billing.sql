-- Оплата через Stripe: ідентифікатори клієнта й підписки (тариф вмикає лише вебхук Stripe)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" varchar(64);
CREATE INDEX IF NOT EXISTS users_stripe_subscription ON users ("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL;
