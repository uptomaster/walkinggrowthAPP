const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByNickname, findUserById } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const SALT_ROUNDS = 12;

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

function registerRoutes(app) {
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { nickname, password } = req.body || {};
      const nick = (nickname || '').trim();
      const pw = password || '';
      if (nick.length < 2) {
        return res.status(400).json({ error: '닉네임은 2자 이상이에요.' });
      }
      if (pw.length < 6) {
        return res.status(400).json({ error: '비밀번호는 6자 이상이에요.' });
      }
      if (findUserByNickname(nick)) {
        return res.status(409).json({ error: '이미 사용 중인 닉네임이에요.' });
      }
      const passwordHash = await bcrypt.hash(pw, SALT_ROUNDS);
      const userId = createUser(nick, passwordHash);
      const user = findUserById(userId);
      const token = jwt.sign(
        { userId: user.id, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.status(201).json({
        token,
        user: { id: user.id, nickname: user.nickname },
      });
    } catch (err) {
      console.error('signup error', err);
      return res.status(500).json({ error: '가입 처리 중 오류가 났어요.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { nickname, password } = req.body || {};
      const nick = (nickname || '').trim();
      const pw = password || '';
      if (!nick || !pw) {
        return res.status(400).json({ error: '닉네임과 비밀번호를 입력해 주세요.' });
      }
      const user = findUserByNickname(nick);
      if (!user) {
        return res.status(401).json({ error: '닉네임 또는 비밀번호가 맞지 않아요.' });
      }
      const match = await bcrypt.compare(pw, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: '닉네임 또는 비밀번호가 맞지 않아요.' });
      }
      const token = jwt.sign(
        { userId: user.id, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        token,
        user: { id: user.id, nickname: user.nickname },
      });
    } catch (err) {
      console.error('login error', err);
      return res.status(500).json({ error: '로그인 처리 중 오류가 났어요.' });
    }
  });

  app.get('/api/user/me', authMiddleware, (req, res) => {
    return res.json({ id: req.userId, nickname: req.nickname });
  });

  return authMiddleware;
}

module.exports = { registerRoutes, authMiddleware };
