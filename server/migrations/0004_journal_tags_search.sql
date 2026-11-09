-- Теги записів щоденника й швидкий пошук за тегом
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags varchar(255)[] NOT NULL DEFAULT ARRAY[]::varchar[];
CREATE INDEX IF NOT EXISTS journal_entries_tags ON journal_entries USING gin (tags);
