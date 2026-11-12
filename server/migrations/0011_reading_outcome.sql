-- «Збулося?»: що людина відповіла про свій розклад (yes / partly / no; NULL — ще не відповіла) і коли.
-- IF NOT EXISTS: безпечно, якщо колонки вже додала автосинхронізація.
ALTER TABLE spreads ADD COLUMN IF NOT EXISTS outcome varchar(8);
ALTER TABLE spreads ADD COLUMN IF NOT EXISTS "outcomeAt" timestamptz;
