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
      const { nickname } = req.query;
      if (!nickname || nickname.trim().length === 0) {
        return res.status(400).json({ error: '닉네임을 입력해 주세요.' });
      }
      const searchNickname = nickname.trim();
      const result = await pool.query(
        `SELECT id, nickname, created_at FROM users 
         WHERE nickname ILIKE $1 AND id != $2 
         ORDER BY nickname LIMIT 20`,
        [`%${searchNickname}%`, req.userId]
      );
      return res.json({ users: result.rows });
    } catch (err) {
      console.error('Friend search error:', err);
      return res.status(500).json({ error: '검색 중 오류가 발생했어요.' });
    }
  });
};
