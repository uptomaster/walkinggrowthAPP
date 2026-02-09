# Vercel 서버리스 함수 제한 최종 해결

## ✅ 완료된 작업

### 1. 카카오 OAuth 함수 통합 (3개 → 1개)
- `kakao-oauth-start.js` 삭제
- `kakao-oauth-callback.js` 삭제
- `kakao-oauth.js` 하나로 통합 (경로에 따라 start/callback 처리)

### 2. Vercel 라우팅 설정
`vercel.json`에 rewrites 추가:
```json
{
  "rewrites": [
    { "source": "/api/auth/kakao-oauth-start", "destination": "/api/auth/kakao-oauth" },
    { "source": "/api/auth/kakao-oauth-callback", "destination": "/api/auth/kakao-oauth" }
  ]
}
```

### 3. 불필요한 함수 제거
- `api/health.js` 삭제 (테스트용, 필수 아님)

## 📊 최종 함수 목록 (12개)

1. `api/auth/login.js`
2. `api/auth/signup.js`
3. `api/auth/social.js`
4. `api/auth/find-id.js`
5. `api/auth/reset-password.js`
6. `api/auth/reset-password-request.js`
7. `api/auth/kakao-oauth.js` ✅ (start + callback 통합)
8. `api/user/data.js`
9. `api/user/me.js`
10. `api/chat.js`
11. `api/friends.js`
12. `api/party.js`

**총 12개 함수** - Vercel Hobby 플랜 제한 내 ✅

## 🚀 배포

변경사항을 커밋하고 푸시하면 배포가 성공할 것입니다:

```bash
git add .
git commit -m "Fix: Reduce serverless functions to 12 (merge Kakao OAuth, remove health)"
git push
```

## 📝 참고

- 기존 `/api/auth/kakao-oauth-start`와 `/api/auth/kakao-oauth-callback` 경로는 그대로 작동합니다 (rewrites를 통해)
- `kakao-oauth.js`가 경로를 확인하여 적절한 함수(start 또는 callback)를 호출합니다
- `health.js`가 필요하다면 나중에 다시 추가할 수 있지만, 다른 함수를 통합해야 합니다
