const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString && connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

async function initTables() {
  const client = await pool.connect();
  try {
    // users 테이블 생성 (기존 컬럼 유지)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nickname TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        email TEXT,
        password_reset_token TEXT,
        password_reset_expires TIMESTAMPTZ,
        social_provider TEXT,
        social_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // email과 social_id에 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_social ON users(social_provider, social_id) WHERE social_provider IS NOT NULL;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
    `);
    
    // user_data 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data_json TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // 기존 users 테이블에 새 컬럼 추가 (마이그레이션)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS social_provider TEXT;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS social_id TEXT;
    `);
  } catch (err) {
    console.error('initTables error:', err);
    throw err;
  } finally {
    client.release();
  }
}

let initDone = false;
let initInProgress = false;
async function ensureInit() {
  if (!connectionString) {
    const err = new Error('DATABASE_URL_NOT_SET');
    throw err;
  }
  if (initDone) {
    return;
  }
  if (initInProgress) {
    // 다른 요청이 초기화 중이면 대기
    while (initInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  initInProgress = true;
  try {
    await initTables();
    initDone = true;
  } catch (err) {
    console.error('ensureInit error:', err);
    throw err;
  } finally {
    initInProgress = false;
  }
}

async function createUser(nickname, passwordHash, email = null) {
  await ensureInit();
  const res = await pool.query(
    'INSERT INTO users (nickname, password_hash, email) VALUES ($1, $2, $3) RETURNING id',
    [nickname, passwordHash, email]
  );
  return res.rows[0].id;
}

async function createSocialUser(nickname, provider, socialId, email = null) {
  await ensureInit();
  try {
    console.log('createSocialUser: Inserting user', { nickname: nickname?.substring(0, 20), provider, socialId: socialId?.substring(0, 10) + '...' });
    const res = await pool.query(
      'INSERT INTO users (nickname, password_hash, social_provider, social_id, email) VALUES ($1, NULL, $2, $3, $4) RETURNING id',
      [nickname, provider, socialId, email]
    );
    console.log('createSocialUser: Insert result', { rowCount: res.rowCount, hasRows: !!res.rows, hasId: !!(res.rows && res.rows[0] && res.rows[0].id) });
    if (!res || !res.rows || !res.rows[0] || !res.rows[0].id) {
      console.error('createSocialUser: Invalid response from DB', res);
      throw new Error('사용자 생성 실패: DB 응답이 올바르지 않아요.');
    }
    return res.rows[0].id;
  } catch (err) {
    console.error('createSocialUser error:', err);
    console.error('Error details:', {
      code: err.code,
      constraint: err.constraint,
      detail: err.detail,
      message: err.message,
      table: err.table
    });
    throw err;
  }
}

async function findUserByNickname(nickname) {
  await ensureInit();
  const res = await pool.query(
    'SELECT id, nickname, password_hash, email, social_provider, social_id FROM users WHERE nickname = $1',
    [nickname]
  );
  return res.rows[0] || null;
}

async function findUserByEmail(email) {
  await ensureInit();
  const res = await pool.query(
    'SELECT id, nickname, email FROM users WHERE email = $1',
    [email]
  );
  return res.rows[0] || null;
}

async function findUserBySocial(provider, socialId) {
  await ensureInit();
  const res = await pool.query(
    'SELECT id, nickname, email, social_provider, social_id FROM users WHERE social_provider = $1 AND social_id = $2',
    [provider, socialId]
  );
  return res.rows[0] || null;
}

async function findUserById(id) {
  await ensureInit();
  const res = await pool.query('SELECT id, nickname, email FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function updatePasswordResetToken(email, token, expiresAt) {
  await ensureInit();
  await pool.query(
    'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
    [token, expiresAt, email]
  );
}

async function findUserByResetToken(token) {
  await ensureInit();
  const res = await pool.query(
    'SELECT id, nickname, email FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
    [token]
  );
  return res.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await ensureInit();
  await pool.query(
    'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
    [passwordHash, userId]
  );
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
  createSocialUser,
  findUserByNickname,
  findUserByEmail,
  findUserBySocial,
  findUserById,
  updatePasswordResetToken,
  findUserByResetToken,
  updatePassword,
  getUserData,
  setUserData,
};
