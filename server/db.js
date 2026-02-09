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
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // created_at 컬럼이 없으면 추가 (기존 테이블 마이그레이션)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
    
    // 기존 users 테이블에 새 컬럼 추가 (마이그레이션) - 인덱스 생성 전에 실행해야 함
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
    
    // password_hash 컬럼이 NOT NULL 제약이 있으면 제거 (소셜 로그인 사용자는 비밀번호가 없음)
    try {
      // 기존 테이블의 password_hash 제약 조건 확인 및 수정
      await client.query(`
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      `);
    } catch (alterErr) {
      // 제약 조건이 없거나 이미 NULL 허용이면 무시
      if (alterErr.code !== '42704' && alterErr.code !== '42804') {
        console.warn('Failed to alter password_hash column:', alterErr.message);
      }
    }
    
    // email과 social_id에 인덱스 추가 (컬럼 추가 후에 실행)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
    `);
    // email 컬럼이 존재하는 경우에만 인덱스 생성 시도
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
      `);
    } catch (idxErr) {
      // 컬럼이 없으면 인덱스 생성 스킵 (이미 컬럼 추가했으므로 일반적으로 발생하지 않음)
      if (idxErr.code !== '42703') throw idxErr;
      console.warn('Email column may not exist, skipping email index creation');
    }
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_social ON users(social_provider, social_id) WHERE social_provider IS NOT NULL;
      `);
    } catch (idxErr) {
      if (idxErr.code !== '42703') throw idxErr;
      console.warn('Social columns may not exist, skipping social index creation');
    }
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
      `);
    } catch (idxErr) {
      if (idxErr.code !== '42703') throw idxErr;
      console.warn('Reset token column may not exist, skipping reset token index creation');
    }
    
    // user_data 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data_json TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // friends 테이블 생성 (친구 관계)
    await client.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id),
        CHECK(user_id != friend_id),
        CHECK(status IN ('pending', 'accepted', 'blocked'))
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);`);
    
    // chats 테이블 생성 (채팅 메시지)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK(sender_id != receiver_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chats_receiver ON chats(receiver_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chats_created ON chats(created_at DESC);`);
    
    // parties 테이블 생성 (파티)
    await client.query(`
      CREATE TABLE IF NOT EXISTS parties (
        id SERIAL PRIMARY KEY,
        leader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_ids INTEGER[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_parties_leader ON parties(leader_id);`);
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
    // NULL 체크 및 검증
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      console.error('createSocialUser: Invalid nickname', { nickname, type: typeof nickname });
      throw new Error('닉네임이 올바르지 않아요.');
    }
    if (!provider || typeof provider !== 'string') {
      console.error('createSocialUser: Invalid provider', { provider, type: typeof provider });
      throw new Error('소셜 제공자가 올바르지 않아요.');
    }
    if (!socialId || (typeof socialId !== 'string' && typeof socialId !== 'number')) {
      console.error('createSocialUser: Invalid socialId', { socialId, type: typeof socialId });
      throw new Error('소셜 ID가 올바르지 않아요.');
    }
    const nicknameTrimmed = nickname.trim();
    const providerTrimmed = provider.trim();
    const socialIdStr = String(socialId).trim();
    console.log('createSocialUser: Inserting user', { 
      nickname: nicknameTrimmed.substring(0, 20), 
      nicknameLength: nicknameTrimmed.length,
      provider: providerTrimmed, 
      socialId: socialIdStr.substring(0, 10) + '...',
      email: email ? 'provided' : 'null'
    });
    const res = await pool.query(
      'INSERT INTO users (nickname, password_hash, social_provider, social_id, email, created_at) VALUES ($1, NULL, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
      [nicknameTrimmed, providerTrimmed, socialIdStr, email]
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
