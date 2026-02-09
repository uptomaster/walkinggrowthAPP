const jwt = require('jsonwebtoken');
const { findUserBySocial, findUserByNickname, createSocialUser, findUserById } = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { provider, socialId, nickname, email } = req.body || {};
    console.log('Social login request:', { provider, socialId, nickname: nickname?.substring(0, 20), email: email ? 'provided' : 'null' });
    if (!provider || !socialId || !nickname) {
      console.error('Missing required fields:', { provider: !!provider, socialId: !!socialId, nickname: !!nickname });
      return res.status(400).json({ error: '필수 정보가 누락되었어요.' });
    }
    if (provider !== 'kakao' && provider !== 'google') {
      return res.status(400).json({ error: '지원하지 않는 소셜 로그인이에요.' });
    }
    
    // 기존 소셜 계정 확인
    console.log('Checking for existing social user:', { provider, socialId: socialId?.substring(0, 10) + '...' });
    let user;
    try {
      user = await findUserBySocial(provider, socialId);
    } catch (findErr) {
      console.error('findUserBySocial error:', findErr);
      throw findErr;
    }
    if (user) {
      console.log('Found existing social user:', { id: user.id, nickname: user.nickname });
      // 기존 계정 로그인
      if (!user.nickname) {
        console.error('Existing user has no nickname:', user);
        return res.status(500).json({ error: '사용자 정보가 올바르지 않아요.' });
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
    }
    console.log('No existing social user found, creating new one...');
    
    // 새 계정 생성
    const emailTrimmed = email ? email.trim().toLowerCase() : null;
    // 닉네임 중복 확인 및 처리
    let finalNickname = (nickname || '').trim();
    console.log('Nickname processing:', { original: nickname, trimmed: finalNickname, length: finalNickname.length });
    if (!finalNickname || finalNickname.length < 2) {
      finalNickname = '카카오사용자' + Math.floor(Math.random() * 10000);
      console.log('Using default nickname:', finalNickname);
    }
    // 최종 검증: NULL이나 빈 문자열이면 안 됨
    if (!finalNickname || finalNickname.trim().length === 0) {
      console.error('Final nickname is empty after processing!', { nickname, finalNickname });
      return res.status(400).json({ error: '닉네임을 생성할 수 없어요.' });
    }
    finalNickname = finalNickname.trim(); // 최종 trim
    let suffix = 1;
    const originalNickname = finalNickname;
    // 닉네임 중복 확인 및 자동 변경
    let existingUser = await findUserByNickname(finalNickname);
    if (existingUser) {
      console.log('Nickname already exists:', { nickname: finalNickname, existingUserId: existingUser.id, existingUserProvider: existingUser.social_provider });
      // 기존 사용자가 소셜 계정이 아닌 경우 (일반 회원가입 사용자)
      if (!existingUser.social_provider) {
        console.log('Existing user is not a social user, generating new nickname...');
      }
      // 중복 닉네임 처리: 숫자 suffix 추가
      while (existingUser) {
        finalNickname = originalNickname + suffix;
        suffix++;
        if (suffix > 1000) {
          // 무한 루프 방지: 타임스탬프 추가
          finalNickname = originalNickname + '_' + Date.now();
          console.log('Using timestamp suffix for nickname:', finalNickname);
          break;
        }
        existingUser = await findUserByNickname(finalNickname);
      }
      console.log('Final nickname after conflict resolution:', finalNickname);
    }
    
    // INSERT 전 최종 중복 확인 (race condition 방지)
    const finalCheck = await findUserByNickname(finalNickname);
    if (finalCheck) {
      console.error('Nickname conflict detected right before insert!', { finalNickname, existingUserId: finalCheck.id });
      // 타임스탬프로 강제 변경
      finalNickname = originalNickname + '_' + Date.now();
      console.log('Forced nickname change:', finalNickname);
    }
    
    console.log('Creating social user:', { finalNickname, finalNicknameLength: finalNickname.length, provider, socialId: socialId?.substring(0, 10) + '...', email: emailTrimmed ? 'provided' : 'null' });
    let userId;
    try {
      userId = await createSocialUser(finalNickname, provider, socialId, emailTrimmed);
    } catch (createErr) {
      console.error('createSocialUser threw error:', createErr);
      console.error('Error code:', createErr.code);
      console.error('Error constraint:', createErr.constraint);
      // 중복된 social_id인 경우 기존 사용자 찾기 시도
      if (createErr.code === '23505') { // Unique violation
        if (createErr.constraint && createErr.constraint.includes('social')) {
          console.log('Social ID already exists, trying to find existing user...');
          const existingUser = await findUserBySocial(provider, socialId);
          if (existingUser) {
            console.log('Found existing user:', existingUser.id);
            const token = jwt.sign(
              { userId: existingUser.id, nickname: existingUser.nickname },
              JWT_SECRET,
              { expiresIn: '30d' }
            );
            return res.json({
              token,
              user: { id: existingUser.id, nickname: existingUser.nickname },
            });
          }
        }
        return res.status(409).json({ error: '이미 사용 중인 계정이에요.' });
      }
      throw createErr; // 다른 에러는 상위로 전달
    }
    if (!userId) {
      console.error('createSocialUser returned null/undefined');
      return res.status(500).json({ error: '사용자 생성에 실패했어요.' });
    }
    console.log('User created successfully, userId:', userId);
    const newUser = await findUserById(userId);
    if (!newUser) {
      console.error('Failed to find user after creation, userId:', userId);
      return res.status(500).json({ error: '사용자 생성 후 정보를 가져올 수 없어요.' });
    }
    if (!newUser.nickname) {
      console.error('User created but nickname is missing:', newUser);
      return res.status(500).json({ error: '사용자 정보가 올바르지 않아요.' });
    }
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
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      constraint: err.constraint,
      detail: err.detail,
      provider: req.body?.provider,
      socialId: req.body?.socialId
    });
    if (err.message === 'DATABASE_URL_NOT_SET') {
      return res.status(503).json({ error: '서버 DB 설정이 필요해요. (DATABASE_URL 환경 변수)' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (err.message && err.message.includes('connect'))) {
      return res.status(503).json({ error: 'DB 연결에 실패했어요. Supabase 연결 정보(DATABASE_URL)를 확인해 주세요.' });
    }
    // PostgreSQL 제약 조건 위반 에러 처리
    if (err.code === '23505') {
      console.error('Unique constraint violation:', { constraint: err.constraint, detail: err.detail });
      if (err.constraint && err.constraint.includes('nickname')) {
        // 닉네임 중복: 재시도 로직 (타임스탬프 추가)
        const retryNickname = (req.body?.nickname || '카카오사용자').trim() + '_' + Date.now();
        console.log('Retrying with new nickname:', retryNickname);
        try {
          const retryUserId = await createSocialUser(retryNickname, req.body?.provider, req.body?.socialId, req.body?.email);
          const retryUser = await findUserById(retryUserId);
          const retryToken = jwt.sign(
            { userId: retryUser.id, nickname: retryUser.nickname },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
          return res.status(201).json({
            token: retryToken,
            user: { id: retryUser.id, nickname: retryUser.nickname },
            message: '닉네임이 중복되어 자동으로 변경되었어요.'
          });
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
          return res.status(409).json({ error: '이미 사용 중인 닉네임이에요. 다른 닉네임을 사용해 주세요.' });
        }
      }
      if (err.constraint && err.constraint.includes('social')) {
        // 소셜 계정 중복: 기존 사용자 찾기 시도
        try {
          const existingSocialUser = await findUserBySocial(req.body?.provider, req.body?.socialId);
          if (existingSocialUser) {
            const token = jwt.sign(
              { userId: existingSocialUser.id, nickname: existingSocialUser.nickname },
              JWT_SECRET,
              { expiresIn: '30d' }
            );
            return res.json({
              token,
              user: { id: existingSocialUser.id, nickname: existingSocialUser.nickname },
            });
          }
        } catch (findErr) {
          console.error('Failed to find existing social user:', findErr);
        }
        return res.status(409).json({ error: '이미 연결된 소셜 계정이에요.' });
      }
      return res.status(409).json({ error: '이미 존재하는 계정이에요.' });
    }
    return res.status(500).json({ 
      error: '소셜 로그인 중 오류가 났어요.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: err.code
    });
  }
};
