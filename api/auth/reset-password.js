const bcrypt = require('bcrypt');
const { findUserByResetToken, updatePassword } = require('../../server/db');

const SALT_ROUNDS = 12;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: '토큰과 새 비밀번호를 입력해 주세요.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이에요.' });
    }
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 토큰이에요.' });
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await updatePassword(user.id, passwordHash);
    return res.json({ message: '비밀번호가 재설정되었어요.' });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ error: '비밀번호 재설정 중 오류가 났어요.' });
  }
};
