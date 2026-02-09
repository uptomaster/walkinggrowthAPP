const jwt = require('jsonwebtoken');
const { getUserData, setUserData } = require('../../server/db');

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
  if (req.method === 'GET') {
    return authMiddleware(req, res, async function() {
      try {
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
