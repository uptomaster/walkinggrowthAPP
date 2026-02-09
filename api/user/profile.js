const { pool } = require('../../server/db');
const { authenticateToken } = require('../../server/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticateToken(req, res);
    if (!userId) return;

    const targetUserId = req.query.userId ? parseInt(req.query.userId, 10) : userId;
    
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
      `SELECT data FROM user_data WHERE user_id = $1`,
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

    if (dataResult.rows.length > 0 && dataResult.rows[0].data) {
      try {
        const userData = typeof dataResult.rows[0].data === 'string' 
          ? JSON.parse(dataResult.rows[0].data) 
          : dataResult.rows[0].data;
        
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
  } catch (err) {
    console.error('Profile API error:', err);
    return res.status(500).json({ error: '프로필 정보를 불러올 수 없어요.' });
  }
};
