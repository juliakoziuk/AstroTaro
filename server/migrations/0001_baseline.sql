-- Базова схема: те, що створювали моделі через sync (src/*/*.model.ts, astrology/astrology.ts → Report).
-- IF NOT EXISTS: на базі, яку вже створила автосинхронізація, міграція нічого не міняє й лише записується як виконана.

DO $$
BEGIN
  CREATE TYPE enum_messages_role AS ENUM ('user', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email varchar(255) NOT NULL CONSTRAINT users_email_key UNIQUE,
  name varchar(255) NOT NULL,
  "passwordHash" varchar(255) NOT NULL,
  "birthDate" date,
  "birthTime" varchar(5),
  "birthPlace" varchar(255),
  country varchar(2),
  "birthLat" double precision,
  "birthLon" double precision,
  plan varchar(255) NOT NULL DEFAULT 'free',
  settings jsonb NOT NULL DEFAULT '{"theme": "Dark", "autosave": true, "insights": true, "language": "English", "companion": true, "dateFormat": "DD/MM/YYYY", "timeFormat": "24-hour", "notifications": true, "defaultReading": "Tarot"}',
  consent jsonb NOT NULL DEFAULT '{"dreams": false, "journal": false, "spreads": false}',
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS dreams (
  id uuid PRIMARY KEY,
  "userId" uuid NOT NULL CONSTRAINT "dreams_userId_fkey" REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date timestamptz NOT NULL,
  title varchar(255) NOT NULL,
  mood varchar(255),
  text text NOT NULL,
  symbols varchar(255)[] NOT NULL DEFAULT ARRAY[]::varchar[],
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS dreams_user_id_date ON dreams ("userId", date);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY,
  "userId" uuid NOT NULL CONSTRAINT "journal_entries_userId_fkey" REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date timestamptz NOT NULL,
  mood smallint NOT NULL,
  text text NOT NULL,
  links jsonb NOT NULL DEFAULT '[]',
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS journal_entries_user_id_date ON journal_entries ("userId", date);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  "userId" uuid NOT NULL CONSTRAINT "messages_userId_fkey" REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  persona varchar(255) NOT NULL DEFAULT 'Mystic Guide',
  role enum_messages_role NOT NULL,
  text text NOT NULL,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_user_id_created_at ON messages ("userId", "createdAt");

-- Report: у моделі userId без зовнішнього ключа, тож і тут без нього
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY,
  "userId" uuid NOT NULL,
  title varchar(255) NOT NULL,
  text text NOT NULL,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_user_id_created_at ON reports ("userId", "createdAt");

CREATE TABLE IF NOT EXISTS spreads (
  id uuid PRIMARY KEY,
  "userId" uuid NOT NULL CONSTRAINT "spreads_userId_fkey" REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  date timestamptz NOT NULL,
  "spreadId" varchar(255) NOT NULL,
  question text NOT NULL DEFAULT '',
  deck varchar(255) NOT NULL DEFAULT 'Classic Tarot',
  mode varchar(255) NOT NULL DEFAULT 'quick',
  saved boolean NOT NULL DEFAULT false,
  cards jsonb NOT NULL,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  narratives jsonb,
  situation jsonb
);
CREATE INDEX IF NOT EXISTS spreads_user_id_date ON spreads ("userId", date);
