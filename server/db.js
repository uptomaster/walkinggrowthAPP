const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('DATABASE_URL이 없습니다. Supabase 연결 정보를 설정해 주세요.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
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
    `);
  } finally {
    client.release();
  }
}

let initDone = false;
async function ensureInit() {
  if (!initDone && connectionString) {
    await initTables();
    initDone = true;
  }
}

async function createUser(nickname, passwordHash) {
  await ensureInit();
  const res = await pool.query(
    'INSERT INTO users (nickname, password_hash) VALUES ($1, $2) RETURNING id',
    [nickname, passwordHash]
  );
  return res.rows[0].id;
}

async function findUserByNickname(nickname) {
  await ensureInit();
  const res = await pool.query(
    'SELECT id, nickname, password_hash FROM users WHERE nickname = $1',
    [nickname]
  );
  return res.rows[0] || null;
}

async function findUserById(id) {
  await ensureInit();
  const res = await pool.query('SELECT id, nickname FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getUserData(userId) {
  await ensureInit();
  const res = await pool.query('SELECT data_json, updated_at FROM user_data WHERE user_id = $1', [userId]);
  return res.rows[0] || null;
}

async function setUserData(userId, dataJson) {
  await ensureInit();
  await pool.query(
    `INSERT INTO user_data (user_id, data_json, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
    [userId, dataJson]
  );
}

module.exports = {
  pool,
  createUser,
  findUserByNickname,
  findUserById,
  getUserData,
  setUserData,
};
