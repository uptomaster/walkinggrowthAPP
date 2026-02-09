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
    } catch (err) {
      console.error('Party create error:', err);
      return res.status(500).json({ error: '파티 생성 중 오류가 발생했어요.' });
    }
  });
};
