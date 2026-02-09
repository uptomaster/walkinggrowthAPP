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
      const { friendId } = req.query;
      if (!friendId) {
        return res.status(400).json({ error: '친구 ID를 입력해 주세요.' });
      }
      // 친구 관계 확인
      const friendCheck = await pool.query(
        `SELECT * FROM friends 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
         AND status = 'accepted'`,
        [req.userId, friendId]
      );
      if (friendCheck.rows.length === 0) {
        return res.status(403).json({ error: '친구에게만 메시지를 볼 수 있어요.' });
      }
      // 메시지 조회
      const messages = await pool.query(
        `SELECT c.id, c.sender_id, c.receiver_id, c.message, c.created_at, c.read_at,
                u.nickname as sender_nickname
         FROM chats c
         JOIN users u ON c.sender_id = u.id
         WHERE (c.sender_id = $1 AND c.receiver_id = $2) OR (c.sender_id = $2 AND c.receiver_id = $1)
         ORDER BY c.created_at ASC`,
        [req.userId, friendId]
      );
      // 읽음 처리
      await pool.query(
        `UPDATE chats SET read_at = CURRENT_TIMESTAMP 
         WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL`,
        [req.userId, friendId]
      );
      return res.json({ messages: messages.rows });
    } catch (err) {
      console.error('Chat messages error:', err);
      return res.status(500).json({ error: '메시지 조회 중 오류가 발생했어요.' });
    }
  });
};
