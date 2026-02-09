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
      // 채팅 목록 (친구별로 마지막 메시지)
      const chatList = await pool.query(
        `SELECT DISTINCT ON (
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
         )
         CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as friend_id,
         CASE WHEN sender_id = $1 THEN u2.nickname ELSE u1.nickname END as friend_nickname,
         message,
         created_at,
         CASE WHEN sender_id = $1 THEN false ELSE read_at IS NULL END as is_unread
         FROM chats
         LEFT JOIN users u1 ON sender_id = u1.id
         LEFT JOIN users u2 ON receiver_id = u2.id
         WHERE sender_id = $1 OR receiver_id = $1
         ORDER BY 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END,
           created_at DESC`,
        [req.userId]
      );
      return res.json({ chats: chatList.rows });
    } catch (err) {
      console.error('Chat list error:', err);
      return res.status(500).json({ error: '채팅 목록 조회 중 오류가 발생했어요.' });
    }
  });
};
