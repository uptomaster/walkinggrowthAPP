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
      const allMemberIds = [partyData.leader_id, ...partyData.member_ids];
      const members = await pool.query(
        `SELECT id, nickname FROM users WHERE id = ANY($1::int[])`,
        [allMemberIds]
      );
      return res.json({ 
        party: {
          id: partyData.id,
          leaderId: partyData.leader_id,
          memberIds: partyData.member_ids,
          members: members.rows,
          createdAt: partyData.created_at
        }
      });
    } catch (err) {
      console.error('Party me error:', err);
      return res.status(500).json({ error: '파티 정보 조회 중 오류가 발생했어요.' });
    }
  });
};
