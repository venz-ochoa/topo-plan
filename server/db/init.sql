--this is for the database tables (this file runs automatically the first time the db container starts)
--to apply changes here reset the database with: docker compose down -v && docker compose up

--this is for the example table (rename or replace with your own tables)
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
