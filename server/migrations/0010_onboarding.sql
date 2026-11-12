-- Онбординг: коли людина його пройшла чи пропустила та що їй цікаво. IF NOT EXISTS: безпечно, якщо колонки вже додала автосинхронізація.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "onboardedAt" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests jsonb NOT NULL DEFAULT '[]'::jsonb;
