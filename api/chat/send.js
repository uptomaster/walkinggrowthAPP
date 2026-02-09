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
      const { receiverId, message } = req.body;
      if (!receiverId || !message || message.trim().length === 0) {
        return res.status(400).json({ error: '받는 사람과 메시지를 입력해 주세요.' });
      }
      if (receiverId === req.userId) {
        return res.status(400).json({ error: '자기 자신에게 메시지를 보낼 수 없어요.' });
      }
      // 친구 관계 확인
      const friendCheck = await pool.query(
        `SELECT * FROM friends 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
         AND status = 'accepted'`,
        [req.userId, receiverId]
      );
      if (friendCheck.rows.length === 0) {
        return res.status(403).json({ error: '친구에게만 메시지를 보낼 수 있어요.' });
      }
      // 메시지 저장
      const result = await pool.query(
        `INSERT INTO chats (sender_id, receiver_id, message) 
         VALUES ($1, $2, $3) RETURNING id, created_at`,
        [req.userId, receiverId, message.trim()]
      );
      return res.json({ 
        success: true, 
        message: result.rows[0],
        chat: {
          id: result.rows[0].id,
          senderId: req.userId,
          receiverId: receiverId,
          message: message.trim(),
          createdAt: result.rows[0].created_at
        }
      });
    } catch (err) {
      console.error('Chat send error:', err);
      return res.status(500).json({ error: '메시지 전송 중 오류가 발생했어요.' });
    }
  });
};
