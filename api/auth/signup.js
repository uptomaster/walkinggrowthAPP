const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByNickname, findUserByEmail, findUserById } = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const SALT_ROUNDS = 12;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { nickname, password, email } = req.body || {};
    const nick = (nickname || '').trim();
    const pw = password || '';
    const emailTrimmed = email ? email.trim().toLowerCase() : null;
    if (nick.length < 2) {
      return res.status(400).json({ error: '닉네임은 2자 이상이에요.' });
    }
    if (pw.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이에요.' });
    }
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return res.status(400).json({ error: '올바른 이메일 형식이 아니에요.' });
    }
    const existing = await findUserByNickname(nick);
    if (existing) {
      return res.status(409).json({ error: '이미 사용 중인 닉네임이에요.' });
    }
    if (emailTrimmed) {
      const existingEmail = await findUserByEmail(emailTrimmed);
      if (existingEmail) {
        return res.status(409).json({ error: '이미 사용 중인 이메일이에요.' });
      }
    }
    const passwordHash = await bcrypt.hash(pw, SALT_ROUNDS);
    const userId = await createUser(nick, passwordHash, emailTrimmed);
    const user = await findUserById(userId);
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
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    if (err.message === 'DATABASE_URL_NOT_SET') {
      return res.status(503).json({ error: '서버 DB 설정이 필요해요. (DATABASE_URL 환경 변수)' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (err.message && err.message.includes('connect'))) {
      return res.status(503).json({ error: 'DB 연결에 실패했어요. Supabase 연결 정보(DATABASE_URL)를 확인해 주세요.' });
    }
    return res.status(500).json({ error: '가입 처리 중 오류가 났어요: ' + (err.message || String(err)) });
  }
};
