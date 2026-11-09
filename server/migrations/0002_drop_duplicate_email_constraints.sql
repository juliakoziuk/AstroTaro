-- Кожен запуск сервера з sync({ alter: true }) додавав ще одне UNIQUE(email) під новим іменем (users_email_key1, key2, …):
-- на базі з розробки їх десятки, і кожен INSERT/UPDATE у users перевіряє їх усі. Лишаємо один users_email_key.
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND contype = 'u' AND conname ~ '^users_email_key[0-9]+$'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
