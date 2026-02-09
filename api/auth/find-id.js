const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail } = require('../../server/db');

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
      return res.status(404).json({ error: '해당 이메일로 가입된 계정이 없어요.' });
    }
    // 보안을 위해 닉네임 일부만 표시
    const nickname = user.nickname;
    const maskedNickname = nickname.length > 2 
      ? nickname.substring(0, Math.floor(nickname.length / 2)) + '*'.repeat(nickname.length - Math.floor(nickname.length / 2))
      : nickname;
    return res.json({ nickname: maskedNickname, fullNickname: nickname });
  } catch (err) {
    console.error('find-id error', err);
    return res.status(500).json({ error: '아이디 찾기 중 오류가 났어요.' });
  }
};
