# 카카오 로그인 `token_exchange_failed` 에러 해결 가이드

## 에러 원인

`token_exchange_failed` 에러는 카카오 OAuth 플로우에서 **인증 코드(code)를 액세스 토큰으로 교환하는 단계**에서 발생합니다.

### 주요 원인 TOP 3

1. **KAKAO_CLIENT_SECRET이 설정되지 않음** (가장 흔한 원인)
   - Vercel 환경 변수에 `KAKAO_CLIENT_SECRET`이 없거나 빈 값
   - 카카오 개발자 콘솔에서 Client Secret을 확인하고 Vercel에 설정 필요

2. **Redirect URI 불일치**
   - 카카오 개발자 콘솔에 등록된 Redirect URI와 실제 요청하는 URI가 정확히 일치하지 않음
   - 현재 코드는 `/api/auth/kakao-oauth-callback`을 사용

3. **인증 코드 만료 또는 재사용**
   - 인증 코드는 한 번만 사용 가능하고 짧은 시간 내에 만료됨
   - 같은 코드를 두 번 사용하면 에러 발생

## 해결 방법

### 1단계: 카카오 개발자 콘솔에서 Client Secret 확인

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 내 애플리케이션 선택
3. **앱 설정 > 앱 키** 메뉴로 이동
4. **REST API 키** 아래에 **Client Secret** 확인
   - 예: `abc123def456ghi789...` (32자 이상의 문자열)

### 2단계: Vercel에 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 환경 변수 추가/수정:

   ```
   이름: KAKAO_CLIENT_SECRET
   값: [카카오 개발자 콘솔에서 복사한 Client Secret]
   ```

4. **Environment** 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (선택사항)

5. **Save** 클릭

### 3단계: Redirect URI 확인

카카오 개발자 콘솔에서 **카카오 로그인 > Redirect URI**에 다음이 등록되어 있는지 확인:

```
https://walkinggrowth-app.vercel.app/api/auth/kakao-oauth-callback
```

**중요**: 
- `/api/auth/kakao-oauth-start`는 **필요 없습니다** (OAuth 시작 엔드포인트이므로)
- `/api/auth/kakao-oauth-callback`만 등록하면 됩니다

### 4단계: 배포 및 테스트

1. Vercel이 자동으로 재배포됩니다 (환경 변수 변경 시)
2. 또는 수동으로 GitHub에 푸시하여 재배포
3. 모바일 앱에서 카카오 로그인 다시 시도

## 디버깅 방법

### Vercel 함수 로그 확인

1. Vercel 대시보드 → 프로젝트 → **Functions** 탭
2. `/api/auth/kakao-oauth` 함수 클릭
3. **Logs** 탭에서 에러 상세 확인

로그에서 확인할 내용:
- `hasClientSecret: true/false` → false면 환경 변수 미설정
- `clientSecretLength: 0` → 환경 변수가 빈 값
- `errorText` → 카카오 서버의 실제 에러 메시지

### 일반적인 카카오 에러 코드

- `invalid_grant`: 인증 코드가 만료되었거나 이미 사용됨
- `invalid_client`: client_id 또는 client_secret이 잘못됨
- `redirect_uri_mismatch`: Redirect URI가 등록된 것과 일치하지 않음

## 예상 결과

환경 변수를 올바르게 설정하면:
- ✅ 카카오 로그인이 정상 작동
- ✅ 인증 코드가 액세스 토큰으로 성공적으로 교환됨
- ✅ 사용자 정보를 가져와서 로그인 완료

## 추가 확인 사항

만약 위 방법으로도 해결되지 않으면:

1. **카카오 앱 상태 확인**: 카카오 개발자 콘솔에서 앱이 **활성화** 상태인지 확인
2. **플랫폼 설정 확인**: Android 플랫폼이 올바르게 설정되어 있는지 확인
3. **Vercel 재배포**: 환경 변수 변경 후 수동으로 재배포 시도
