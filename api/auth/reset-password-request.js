const crypto = require('crypto');
const { findUserByEmail, findUserByNickname, updatePasswordResetToken } = require('../../server/db');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { email } = req.body || {};
    const emailTrimmed = (email || '').trim().toLowerCase();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return res.status(400).json({ error: '올바른 이메일을 입력해 주세요.' });
    }
    const user = await findUserByEmail(emailTrimmed);
    if (!user) {
      // 보안을 위해 존재하지 않는 이메일이어도 성공 메시지 반환
      return res.json({ message: '비밀번호 재설정 링크를 발송했어요. (이메일을 확인해 주세요)' });
    }
    // 소셜 로그인 계정은 비밀번호 재설정 불가
    const fullUser = await findUserByNickname(user.nickname);
    if (fullUser && fullUser.social_provider) {
      return res.status(400).json({ error: '소셜 로그인 계정은 비밀번호 재설정이 불가능해요.' });
    }
    
    // 토큰 생성 (32바이트 랜덤)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1시간 후 만료
    
    await updatePasswordResetToken(emailTrimmed, token, expiresAt);
    
    // 실제 이메일 발송은 구현하지 않음 (프로덕션에서는 이메일 서비스 연동 필요)
    // 여기서는 토큰을 응답으로 반환 (개발용)
    return res.json({ 
      message: '비밀번호 재설정 링크를 발송했어요.',
      resetToken: process.env.NODE_ENV === 'development' ? token : undefined // 개발 환경에서만 토큰 반환
    });
  } catch (err) {
    console.error('reset-password-request error', err);
    return res.status(500).json({ error: '비밀번호 재설정 요청 중 오류가 났어요.' });
  }
};
