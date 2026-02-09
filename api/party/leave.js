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
    } catch (err) {
      console.error('Party leave error:', err);
      return res.status(500).json({ error: '파티 나가기 중 오류가 발생했어요.' });
    }
  });
};
