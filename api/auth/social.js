const jwt = require('jsonwebtoken');
const { findUserBySocial, findUserByNickname, createSocialUser, findUserById } = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { provider, socialId, nickname, email } = req.body || {};
    if (!provider || !socialId || !nickname) {
      return res.status(400).json({ error: '필수 정보가 누락되었어요.' });
    }
    if (provider !== 'kakao' && provider !== 'google') {
      return res.status(400).json({ error: '지원하지 않는 소셜 로그인이에요.' });
    }
    
    // 기존 소셜 계정 확인
    let user = await findUserBySocial(provider, socialId);
    if (user) {
      // 기존 계정 로그인
      const token = jwt.sign(
        { userId: user.id, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        token,
        user: { id: user.id, nickname: user.nickname },
      });
    }
    
    // 새 계정 생성
    const emailTrimmed = email ? email.trim().toLowerCase() : null;
    // 닉네임 중복 확인 및 처리
    let finalNickname = nickname.trim();
    let suffix = 1;
    while (await findUserByNickname(finalNickname)) {
      finalNickname = nickname.trim() + suffix;
      suffix++;
    }
    
    const userId = await createSocialUser(finalNickname, provider, socialId, emailTrimmed);
    const newUser = await findUserById(userId);
    const token = jwt.sign(
      { userId: newUser.id, nickname: newUser.nickname },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.status(201).json({
      token,
      user: { id: newUser.id, nickname: newUser.nickname },
    });
  } catch (err) {
    console.error('social login error', err);
    return res.status(500).json({ error: '소셜 로그인 중 오류가 났어요.' });
  }
};
