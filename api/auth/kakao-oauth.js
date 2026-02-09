const jwt = require('jsonwebtoken');
const { findUserBySocial, findUserByNickname, createSocialUser, findUserById } = require('../../server/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '1f0b84df4d86cb3d668020799bcc7473';
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';
// 리다이렉트 URI는 요청의 origin을 사용하거나 환경 변수 사용
const getRedirectUri = (req) => {
  if (process.env.KAKAO_REDIRECT_URI) {
    return process.env.KAKAO_REDIRECT_URI;
  }
  const origin = req.headers.origin || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${origin}/api/auth/kakao-oauth-callback`;
};

// 카카오 OAuth 시작 (리다이렉트 URL 반환)
const start = async (req, res) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const redirectUri = getRedirectUri(req);
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
    
    console.log('Kakao OAuth start:', { redirectUri, kakaoAuthUrl });
    
    return res.json({ 
      authUrl: kakaoAuthUrl,
      state: state 
    });
  } catch (err) {
    console.error('Kakao OAuth start error:', err);
    return res.status(500).json({ error: '카카오 로그인 시작에 실패했어요.' });
  }
};

// 카카오 OAuth 콜백 (인증 코드로 액세스 토큰 교환 및 사용자 정보 조회)
const callback = async (req, res) => {
  try {
    const { code, error } = req.query;
    const redirectUri = getRedirectUri(req);
    
    if (error) {
      console.error('Kakao OAuth error:', error);
      return res.redirect(`walkstory://oauth?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect('walkstory://oauth?error=no_code');
    }
    
    console.log('Kakao OAuth callback:', { code: code.substring(0, 10) + '...', redirectUri });
    
    // 액세스 토큰 교환
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        client_secret: KAKAO_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Kakao token exchange error:', errorText);
      return res.redirect(`walkstory://oauth?error=token_exchange_failed`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return res.redirect('walkstory://oauth?error=no_access_token');
    }
    
    // 사용자 정보 조회
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Kakao user info error:', errorText);
      return res.redirect(`walkstory://oauth?error=user_info_failed`);
    }
    
    const userData = await userResponse.json();
    const socialId = userData.id ? userData.id.toString() : null;
    
    if (!socialId) {
      return res.redirect('walkstory://oauth?error=no_user_id');
    }
    
    // 닉네임 추출
    let nickname = '카카오사용자' + Math.floor(Math.random() * 10000);
    if (userData.kakao_account) {
      if (userData.kakao_account.profile && userData.kakao_account.profile.nickname) {
        nickname = userData.kakao_account.profile.nickname;
      } else if (userData.kakao_account.profile_nickname) {
        nickname = userData.kakao_account.profile_nickname;
      }
    }
    if (userData.properties && userData.properties.nickname) {
      nickname = userData.properties.nickname;
    }
    
    // 기존 사용자 확인 또는 생성
    let user = await findUserBySocial('kakao', socialId);
    
    if (!user) {
      // 새 사용자 생성
      let finalNickname = nickname.trim();
      if (!finalNickname || finalNickname.length < 2) {
        finalNickname = '카카오사용자' + Math.floor(Math.random() * 10000);
      }
      
      // 닉네임 중복 처리
      let existingUser = await findUserByNickname(finalNickname);
      let suffix = 1;
      const originalNickname = finalNickname;
      while (existingUser) {
        finalNickname = originalNickname + suffix;
        suffix++;
        if (suffix > 1000) {
          finalNickname = originalNickname + '_' + Date.now();
          break;
        }
        existingUser = await findUserByNickname(finalNickname);
      }
      
      const userId = await createSocialUser(finalNickname, 'kakao', socialId, null);
      user = await findUserById(userId);
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // 모바일 앱으로 리다이렉트 (커스텀 URL 스킴)
    return res.redirect(`walkstory://oauth?token=${encodeURIComponent(token)}&userId=${user.id}&nickname=${encodeURIComponent(user.nickname)}`);
    
  } catch (err) {
    console.error('Kakao OAuth callback error:', err);
    return res.redirect(`walkstory://oauth?error=${encodeURIComponent(err.message)}`);
  }
};

// Vercel 서버리스 함수: 경로에 따라 start 또는 callback 호출
module.exports = async (req, res) => {
  const path = req.url || req.path || '';
  
  if (path.includes('callback') || req.query.code) {
    return callback(req, res);
  } else {
    return start(req, res);
  }
};
