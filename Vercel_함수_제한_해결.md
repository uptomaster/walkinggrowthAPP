# Vercel 서버리스 함수 제한 해결 완료

## 🔴 문제

Vercel Hobby 플랜은 최대 **12개의 서버리스 함수**만 배포할 수 있습니다.
현재 프로젝트에는 **15개의 함수**가 있어 배포가 실패했습니다.

## ✅ 해결 방법

### 1. 카카오 OAuth 함수 통합

**변경 전 (3개 함수):**
- `api/auth/kakao-oauth-start.js`
- `api/auth/kakao-oauth-callback.js`
- `api/auth/kakao-oauth.js` (내부 모듈)

**변경 후 (1개 함수):**
- `api/auth/kakao-oauth.js` (start와 callback 모두 처리)

### 2. Vercel 라우팅 설정

`vercel.json`에 라우팅 규칙 추가:
```json
{
  "rewrites": [
    { "source": "/api/auth/kakao-oauth-start", "destination": "/api/auth/kakao-oauth" },
    { "source": "/api/auth/kakao-oauth-callback", "destination": "/api/auth/kakao-oauth" }
  ]
}
```

이제 두 경로 모두 같은 함수로 라우팅됩니다.

### 3. 함수 로직 수정

`kakao-oauth.js`에서 요청 경로를 확인하여 start 또는 callback을 호출:
```javascript
module.exports = async (req, res) => {
  const path = req.url || req.path || '';
  
  if (path.includes('callback') || req.query.code) {
    return callback(req, res);
  } else {
    return start(req, res);
  }
};
```

## 📊 함수 수 변화

**변경 전:** 15개 함수
1. api/auth/login.js
2. api/auth/signup.js
3. api/auth/social.js
4. api/auth/find-id.js
5. api/auth/reset-password.js
6. api/auth/reset-password-request.js
7. api/auth/kakao-oauth-start.js ❌
8. api/auth/kakao-oauth-callback.js ❌
9. api/auth/kakao-oauth.js
10. api/user/data.js
11. api/user/me.js
12. api/chat.js
13. api/friends.js
14. api/party.js
15. api/health.js

**변경 후:** 13개 함수
1. api/auth/login.js
2. api/auth/signup.js
3. api/auth/social.js
4. api/auth/find-id.js
5. api/auth/reset-password.js
6. api/auth/reset-password-request.js
7. api/auth/kakao-oauth.js ✅ (start + callback 통합)
8. api/user/data.js
9. api/user/me.js
10. api/chat.js
11. api/friends.js
12. api/party.js
13. api/health.js

## ⚠️ 여전히 12개 초과

현재 **13개 함수**로 여전히 12개 제한을 초과합니다.

### 추가 해결 방법

**옵션 1: health.js 제거 (권장)**
- `api/health.js`는 테스트용일 가능성이 높습니다
- 사용하지 않는다면 삭제하여 12개로 맞출 수 있습니다

**옵션 2: 더 많은 함수 통합**
- 비슷한 기능의 함수들을 통합 (예: reset-password와 reset-password-request)

**옵션 3: Vercel Pro 플랜 업그레이드**
- Pro 플랜으로 업그레이드하면 더 많은 함수를 배포할 수 있습니다

## 🚀 다음 단계

1. **변경사항 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "Reduce serverless functions: merge Kakao OAuth endpoints"
   git push
   ```

2. **Vercel 배포 확인**
   - 배포가 성공하는지 확인
   - 함수 수가 12개 이하인지 확인

3. **필요시 health.js 제거**
   - 사용하지 않는다면 삭제하여 정확히 12개로 맞춤

## 📝 참고

- Vercel 함수 제한: https://vercel.com/docs/functions/serverless-functions/function-configuration
- 라우팅 규칙: https://vercel.com/docs/project-configuration#rewrites
