const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { 
  createUser, 
  createSocialUser,
  findUserByNickname, 
  findUserByEmail,
  findUserBySocial,
  findUserById,
  updatePasswordResetToken,
  findUserByResetToken,
  updatePassword
} = require('./db');

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
      const { nickname, password, email } = req.body || {};
      const nick = (nickname || '').trim();
      const pw = password || '';
      const emailTrimmed = email ? email.trim().toLowerCase() : null;
      if (nick.length < 2) {
        return res.status(400).json({ error: '닉네임은 2자 이상이에요.' });
      }
      if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        return res.status(400).json({ error: '올바른 이메일을 입력해 주세요.' });
      }
      if (pw.length < 6) {
        return res.status(400).json({ error: '비밀번호는 6자 이상이에요.' });
      }
      const existing = await findUserByNickname(nick);
      if (existing) {
        return res.status(409).json({ error: '이미 사용 중인 닉네임이에요.' });
      }
      const existingEmail = await findUserByEmail(emailTrimmed);
      if (existingEmail) {
        return res.status(409).json({ error: '이미 사용 중인 이메일이에요.' });
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
      if (err.message === 'DATABASE_URL_NOT_SET') {
        return res.status(503).json({ error: '서버 DB 설정이 필요해요. (DATABASE_URL 환경 변수)' });
      }
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message && err.message.includes('connect')) {
        return res.status(503).json({ error: 'DB 연결에 실패했어요. Supabase 연결 정보(DATABASE_URL)를 확인해 주세요.' });
      }
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
  });

  // 아이디 찾기 (이메일로 닉네임 찾기)
  app.post('/api/auth/find-id', async (req, res) => {
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
  });

  // 비밀번호 재설정 요청 (이메일로 토큰 발급)
  app.post('/api/auth/reset-password-request', async (req, res) => {
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
  });

  // 비밀번호 재설정 (토큰으로 비밀번호 변경)
  app.post('/api/auth/reset-password', async (req, res) => {
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
  });

  // 소셜 로그인 (카카오/구글)
  app.post('/api/auth/social', async (req, res) => {
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
  });

  app.get('/api/user/me', authMiddleware, (req, res) => {
    return res.json({ id: req.userId, nickname: req.nickname });
  });

  return authMiddleware;
}

module.exports = { registerRoutes, authMiddleware };
