-- Supabase SQL Editor에서 이 스크립트를 한 번 실행하세요.
-- (Table Editor가 아니라 상단 메뉴에서 SQL Editor → New query → 붙여넣기 → Run)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nickname TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data_json TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
