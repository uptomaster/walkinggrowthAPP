const { getUserData, setUserData } = require('./db');
const { authMiddleware } = require('./auth');

function registerRoutes(app) {
  app.get('/api/user/data', authMiddleware, async (req, res) => {
    try {
      const row = await getUserData(req.userId);
      if (!row || row.data_json == null) {
        return res.json({ data: null });
      }
      return res.json({ data: row.data_json });
    } catch (err) {
      console.error('get user data error', err);
      return res.status(500).json({ error: '데이터를 불러오는 중 오류가 났어요.' });
    }
  });

  app.post('/api/user/data', authMiddleware, async (req, res) => {
    try {
      const dataJson = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      await setUserData(req.userId, dataJson);
      return res.json({ ok: true });
    } catch (err) {
      console.error('set user data error', err);
      return res.status(500).json({ error: '데이터를 저장하는 중 오류가 났어요.' });
    }
  });
}

module.exports = { registerRoutes };
