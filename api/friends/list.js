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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return authMiddleware(req, res, async function() {
    try {
      // 내가 받은 친구 요청 (pending, 내가 receiver)
      const receivedRequests = await pool.query(
        `SELECT f.id, f.user_id, f.friend_id, f.status, f.created_at, u.nickname 
         FROM friends f
         JOIN users u ON f.user_id = u.id
         WHERE f.friend_id = $1 AND f.status = 'pending'`,
        [req.userId]
      );
      // 내 친구 목록 (accepted)
      const friends = await pool.query(
        `SELECT 
           CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END as friend_id,
           CASE WHEN f.user_id = $1 THEN u2.nickname ELSE u1.nickname END as nickname,
           f.created_at
         FROM friends f
         LEFT JOIN users u1 ON f.user_id = u1.id
         LEFT JOIN users u2 ON f.friend_id = u2.id
         WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'`,
        [req.userId]
      );
      return res.json({ 
        receivedRequests: receivedRequests.rows,
        friends: friends.rows
      });
    } catch (err) {
      console.error('Friend list error:', err);
      return res.status(500).json({ error: '친구 목록 조회 중 오류가 발생했어요.' });
    }
  });
};
