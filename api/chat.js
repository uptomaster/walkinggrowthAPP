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
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action');
  
  // 채팅 목록 조회 (GET /api/chat 또는 GET /api/chat?action=list)
  if (req.method === 'GET' && (!action || action === 'list')) {
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
  }
  
  // 메시지 조회 (GET /api/chat?action=messages&friendId=...)
  if (req.method === 'GET' && action === 'messages') {
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
  }
  
  // 메시지 전송 (POST /api/chat)
  if (req.method === 'POST') {
    return authMiddleware(req, res, async function() {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { receiverId, message } = body;
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
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
