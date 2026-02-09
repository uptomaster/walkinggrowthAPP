const jwt = require('jsonwebtoken');
const { getUserData, setUserData, pool } = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

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
  
  if (req.method === 'GET') {
    return authMiddleware(req, res, async function() {
      try {
        // 프로필 조회 액션
        if (req.query.action === 'profile') {
          const targetUserId = req.query.userId ? parseInt(req.query.userId, 10) : req.userId;
          
          if (isNaN(targetUserId)) {
            return res.status(400).json({ error: '올바른 사용자 ID를 입력해 주세요.' });
          }

          // 사용자 정보 조회
          const userResult = await pool.query(
            `SELECT id, nickname, created_at FROM users WHERE id = $1`,
            [targetUserId]
          );

          if (userResult.rows.length === 0) {
            return res.status(404).json({ error: '사용자를 찾을 수 없어요.' });
          }

          const user = userResult.rows[0];

          // 사용자 데이터 조회
          const dataResult = await pool.query(
            `SELECT data_json FROM user_data WHERE user_id = $1`,
            [targetUserId]
          );

          let profileData = {
            nickname: user.nickname,
            totalXp: 0,
            lifetimeSteps: 0,
            totalWalkDistanceKm: 0,
            gold: 0,
            capturedAnimals: []
          };

          if (dataResult.rows.length > 0 && dataResult.rows[0].data_json) {
            try {
              const userData = typeof dataResult.rows[0].data_json === 'string' 
                ? JSON.parse(dataResult.rows[0].data_json) 
                : dataResult.rows[0].data_json;
              
              profileData.totalXp = userData.totalXp || 0;
              profileData.lifetimeSteps = userData.lifetimeSteps || 0;
              profileData.totalWalkDistanceKm = userData.totalWalkDistanceKm || 0;
              profileData.gold = userData.gold || 0;
              profileData.capturedAnimals = userData.capturedAnimals || [];
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }

          return res.json(profileData);
        }
        
        // 기본 데이터 조회
        const row = await getUserData(req.userId);
        if (!row || row.data_json == null) {
          return res.json({ data: null });
        }
        return res.json({ data: row.data_json });
      } catch (err) {
        console.error('get user data error', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          userId: req.userId
        });
        return res.status(500).json({ 
          error: '데이터를 불러오는 중 오류가 났어요.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    });
  }
  if (req.method === 'POST') {
    return authMiddleware(req, res, async function() {
      try {
        const dataJson = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
        await setUserData(req.userId, dataJson);
        return res.json({ ok: true });
      } catch (err) {
        console.error('set user data error', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          userId: req.userId,
          dataJsonLength: dataJson ? dataJson.length : 0
        });
        return res.status(500).json({ 
          error: '데이터를 저장하는 중 오류가 났어요.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
