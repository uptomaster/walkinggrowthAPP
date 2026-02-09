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
  // 파티 정보 조회 (GET /api/party)
  if (req.method === 'GET') {
    return authMiddleware(req, res, async function() {
      try {
        // 내가 속한 파티 찾기
        const party = await pool.query(
          `SELECT * FROM parties WHERE $1 = ANY(member_ids) OR leader_id = $1`,
          [req.userId]
        );
        if (party.rows.length === 0) {
          return res.json({ party: null });
        }
        const partyData = party.rows[0];
        // 멤버 정보 조회
        const memberIds = partyData.member_ids || [];
        // 리더를 포함한 모든 멤버 ID (중복 제거)
        const allMemberIds = Array.from(new Set([partyData.leader_id, ...memberIds]));
        let members = { rows: [] };
        if (allMemberIds.length > 0) {
          members = await pool.query(
            `SELECT id, nickname FROM users WHERE id = ANY($1::int[])`,
            [allMemberIds]
          );
        }
        return res.json({ 
          party: {
            id: partyData.id,
            leaderId: partyData.leader_id,
            memberIds: memberIds,
            members: members.rows,
            createdAt: partyData.created_at
          }
        });
      } catch (err) {
        console.error('Party me error:', err);
        console.error('Error details:', { message: err.message, stack: err.stack });
        return res.status(500).json({ error: '파티 정보 조회 중 오류가 발생했어요.' });
      }
    });
  }
  
  // 파티 생성/참여/나가기 (POST /api/party)
  if (req.method === 'POST') {
    return authMiddleware(req, res, async function() {
      try {
        let body = req.body;
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body);
          } catch (e) {
            return res.status(400).json({ error: '잘못된 요청 형식이에요.' });
          }
        }
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: '요청 본문이 필요해요.' });
        }
        const { action, partyId } = body;
        
        // 파티 생성
        if (action === 'create' || (!action && !partyId)) {
          // 이미 파티에 속해있는지 확인
          const existingParty = await pool.query(
            `SELECT * FROM parties WHERE $1 = ANY(member_ids) OR leader_id = $1`,
            [req.userId]
          );
          if (existingParty.rows.length > 0) {
            return res.status(400).json({ error: '이미 파티에 속해있어요.' });
          }
          // 새 파티 생성
          const result = await pool.query(
            `INSERT INTO parties (leader_id, member_ids) 
             VALUES ($1, ARRAY[$1]) RETURNING id, leader_id, member_ids`,
            [req.userId]
          );
          return res.json({ 
            success: true, 
            party: result.rows[0]
          });
        }
        
        // 파티 참여
        if (action === 'join' || (!action && partyId)) {
          const targetPartyId = partyId || body.partyId;
          if (!targetPartyId) {
            return res.status(400).json({ error: '파티 ID를 입력해 주세요.' });
          }
          // 이미 파티에 속해있는지 확인
          const existingParty = await pool.query(
            `SELECT * FROM parties WHERE $1 = ANY(member_ids) OR leader_id = $1`,
            [req.userId]
          );
          if (existingParty.rows.length > 0) {
            return res.status(400).json({ error: '이미 파티에 속해있어요.' });
          }
          // 파티 조회 및 멤버 추가
          const party = await pool.query(
            `SELECT * FROM parties WHERE id = $1`,
            [targetPartyId]
          );
          if (party.rows.length === 0) {
            return res.status(404).json({ error: '파티를 찾을 수 없어요.' });
          }
          const currentMemberIds = party.rows[0].member_ids || [];
          if (currentMemberIds.length >= 4) {
            return res.status(400).json({ error: '파티가 가득 찼어요. (최대 4명)' });
          }
          // 친구 관계 확인 (리더와 친구여야 함)
          const friendCheck = await pool.query(
            `SELECT * FROM friends 
             WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
             AND status = 'accepted'`,
            [req.userId, party.rows[0].leader_id]
          );
          if (friendCheck.rows.length === 0 && party.rows[0].leader_id !== req.userId) {
            return res.status(403).json({ error: '파티 리더와 친구여야 파티에 참여할 수 있어요.' });
          }
          // 멤버 추가
          const updated = await pool.query(
            `UPDATE parties SET member_ids = array_append(member_ids, $1), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [req.userId, targetPartyId]
          );
          return res.json({ 
            success: true,
            party: updated.rows[0]
          });
        }
        
        // 파티 나가기
        if (action === 'leave') {
          // 내가 속한 파티 찾기
          const party = await pool.query(
            `SELECT * FROM parties WHERE $1 = ANY(member_ids) OR leader_id = $1`,
            [req.userId]
          );
          if (party.rows.length === 0) {
            return res.status(404).json({ error: '파티에 속해있지 않아요.' });
          }
          const partyData = party.rows[0];
          // 리더인 경우 파티 삭제
          if (partyData.leader_id === req.userId) {
            await pool.query(`DELETE FROM parties WHERE id = $1`, [partyData.id]);
            return res.json({ success: true, message: '파티를 해체했어요.' });
          }
          // 멤버인 경우 멤버에서 제거
          await pool.query(
            `UPDATE parties SET member_ids = array_remove(member_ids, $1), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [req.userId, partyData.id]
          );
          return res.json({ success: true, message: '파티에서 나갔어요.' });
        }
        
        return res.status(400).json({ error: '올바른 액션을 입력해 주세요.' });
      } catch (err) {
        console.error('Party action error:', err);
        console.error('Error details:', { message: err.message, stack: err.stack, body: req.body });
        return res.status(500).json({ error: '파티 처리 중 오류가 발생했어요.' });
      }
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
