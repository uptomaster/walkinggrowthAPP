const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: '로그인이 필요해요.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.nickname = payload.nickname;
    next();
  } catch (err) {
    return res.status(401).json({ error: '토큰이 만료되었거나 잘못되었어요. 다시 로그인해 주세요.' });
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return authMiddleware(req, res, async function() {
    try {
      const { friendId } = req.body;
      if (!friendId || friendId === req.userId) {
        return res.status(400).json({ error: '올바른 친구 ID를 입력해 주세요.' });
      }
      // 이미 친구 관계가 있는지 확인
      const existing = await pool.query(
        `SELECT * FROM friends 
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [req.userId, friendId]
      );
      if (existing.rows.length > 0) {
        const status = existing.rows[0].status;
        if (status === 'accepted') {
          return res.status(400).json({ error: '이미 친구예요.' });
        }
        if (status === 'pending') {
          return res.status(400).json({ error: '이미 친구 요청을 보냈어요.' });
        }
      }
      // 친구 요청 생성
      await pool.query(
        `INSERT INTO friends (user_id, friend_id, status) 
         VALUES ($1, $2, 'pending') 
         ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP`,
        [req.userId, friendId]
      );
      return res.json({ success: true, message: '친구 요청을 보냈어요.' });
    } catch (err) {
      console.error('Friend request error:', err);
      return res.status(500).json({ error: '친구 요청 중 오류가 발생했어요.' });
    }
  });
};
