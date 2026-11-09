-- Час останньої події оплати, яку ми застосували: старіша подія (повторна доставка чи порушений порядок) уже нічого не змінює
ALTER TABLE users ADD COLUMN IF NOT EXISTS "billingEventAt" timestamptz;
