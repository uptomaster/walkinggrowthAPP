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
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action');
  
  // 친구 검색 (GET /api/friends?action=search&nickname=...)
  if (req.method === 'GET' && action === 'search') {
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
  }
  
  // 친구 목록 조회 (GET /api/friends 또는 GET /api/friends?action=list)
  if (req.method === 'GET' && (!action || action === 'list')) {
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
        // 내 친구 목록 (accepted) - UNION으로 명확하게 분리
        const friends = await pool.query(
          `SELECT 
             f.friend_id,
             u2.nickname,
             f.created_at
           FROM friends f
           JOIN users u2 ON f.friend_id = u2.id
           WHERE f.user_id = $1 AND f.status = 'accepted'
           UNION ALL
           SELECT 
             f.user_id as friend_id,
             u1.nickname,
             f.created_at
           FROM friends f
           JOIN users u1 ON f.user_id = u1.id
           WHERE f.friend_id = $1 AND f.status = 'accepted'
           ORDER BY created_at DESC`,
          [req.userId]
        );
        
        // 각 친구의 산책 상태 조회
        const friendsWithStatus = await Promise.all(
          friends.rows.map(async (friend) => {
            const dataResult = await pool.query(
              `SELECT data_json FROM user_data WHERE user_id = $1`,
              [friend.friend_id]
            );
            let isWalking = false;
            if (dataResult.rows.length > 0 && dataResult.rows[0].data_json) {
              try {
                const userData = typeof dataResult.rows[0].data_json === 'string' 
                  ? JSON.parse(dataResult.rows[0].data_json) 
                  : dataResult.rows[0].data_json;
                isWalking = userData.walkState === 'walking';
              } catch (e) {
                console.error('Error parsing user data for walking status:', e);
              }
            }
            return {
              ...friend,
              isWalking: isWalking
            };
          })
        );
        
        return res.json({ 
          receivedRequests: receivedRequests.rows,
          friends: friendsWithStatus
        });
      } catch (err) {
        console.error('Friend list error:', err);
        return res.status(500).json({ error: '친구 목록 조회 중 오류가 발생했어요.' });
      }
    });
  }
  
  // 친구 요청 전송 (POST /api/friends with body: { action: 'request', friendId: ... })
  if (req.method === 'POST') {
    return authMiddleware(req, res, async function() {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { action, friendId, requestId } = body;
        
        // 친구 요청 전송
        if (action === 'request' || (!action && friendId)) {
          const targetFriendId = friendId || body.friendId;
          if (!targetFriendId || targetFriendId === req.userId) {
            return res.status(400).json({ error: '올바른 친구 ID를 입력해 주세요.' });
          }
          // 이미 친구 관계가 있는지 확인
          const existing = await pool.query(
            `SELECT * FROM friends 
             WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            [req.userId, targetFriendId]
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
            [req.userId, targetFriendId]
          );
          return res.json({ success: true, message: '친구 요청을 보냈어요.' });
        }
        
        // 친구 요청 응답 (수락/거절)
        if (action === 'respond' || action === 'accept' || action === 'reject') {
          const targetRequestId = requestId || body.requestId;
          const respondAction = action === 'respond' ? (body.respondAction || body.action) : (action === 'accept' ? 'accept' : 'reject');
          
          if (!targetRequestId || !respondAction || !['accept', 'reject'].includes(respondAction)) {
            return res.status(400).json({ error: '올바른 요청 정보를 입력해 주세요.' });
          }
          // 요청 확인 (내가 받은 요청인지)
          const request = await pool.query(
            `SELECT * FROM friends WHERE id = $1 AND friend_id = $2 AND status = 'pending'`,
            [targetRequestId, req.userId]
          );
          if (request.rows.length === 0) {
            return res.status(404).json({ error: '친구 요청을 찾을 수 없어요.' });
          }
          if (respondAction === 'accept') {
            await pool.query(
              `UPDATE friends SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [targetRequestId]
            );
            return res.json({ success: true, message: '친구 요청을 수락했어요.' });
          } else {
            await pool.query(`DELETE FROM friends WHERE id = $1`, [targetRequestId]);
            return res.json({ success: true, message: '친구 요청을 거절했어요.' });
          }
        }
        
        return res.status(400).json({ error: '올바른 액션을 입력해 주세요.' });
      } catch (err) {
        console.error('Friend request error:', err);
        return res.status(500).json({ error: '친구 요청 처리 중 오류가 발생했어요.' });
      }
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
