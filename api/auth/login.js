const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByNickname } = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { nickname, password } = req.body || {};
    const nick = (nickname || '').trim();
    const pw = password || '';
    if (!nick || !pw) {
      return res.status(400).json({ error: '닉네임과 비밀번호를 입력해 주세요.' });
    }
    const user = await findUserByNickname(nick);
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
};
