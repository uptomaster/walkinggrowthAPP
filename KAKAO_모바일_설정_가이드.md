# 카카오 로그인 모바일 앱 설정 가이드

## 🔴 현재 문제

모바일 앱에서 카카오 로그인 시 다음 오류가 발생합니다:
- **KOE009**: 등록되지 않은 플랫폼에서 액세스 토큰 요청
- JavaScript SDK 도메인이 `https://localhost`로 표시됨
- 네트워크 오류 발생

## ✅ 해결 방법

### 1. 카카오 개발자 콘솔 설정 (필수!)

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. **내 애플리케이션** → **WalkStory** 앱 선택
3. **앱 설정** → **플랫폼** 메뉴로 이동

### 2. Android 플랫폼 추가 (필수!)

**플랫폼 추가** 버튼 클릭 → **Android** 선택

다음 정보 입력:
- **패키지 이름**: `com.walkstory.app` ⚠️ 정확히 입력해야 함!
- **키 해시**: (아래에서 생성)

#### 키 해시 생성 방법

**방법 1: Gradle 사용 (권장)**

```bash
cd android
./gradlew signingReport
```

출력에서 **SHA1** 값을 찾아 복사합니다. (예: `A1:B2:C3:...`)

**방법 2: keytool 직접 사용**

**Windows:**
```bash
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**macOS/Linux:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

출력에서 **SHA1** 값을 찾아 카카오 콘솔에 입력합니다.
⚠️ **중요**: 키 해시 입력 시 콜론(:)을 제거한 형식으로 입력해야 합니다!
예: `A1:B2:C3:...` → `A1B2C3...`

**⚠️ 중요**: 
- 개발용: `debug.keystore`의 SHA1 사용
- 프로덕션: 서명 키(`walkstory-release.keystore`)의 SHA1 사용
- 프로덕션 빌드 전에 서명 키의 SHA1도 등록해야 합니다!

### 3. iOS 플랫폼 추가 (선택사항)

**플랫폼 추가** 버튼 클릭 → **iOS** 선택

다음 정보 입력:
- **번들 ID**: `com.walkstory.app`
- **팀 ID**: Apple Developer 계정의 Team ID

### 4. 카카오 SDK 초기화 확인

모바일 앱에서는 카카오 JavaScript SDK가 제대로 작동하지 않을 수 있습니다. 

**대안: 네이티브 카카오 로그인 사용**

Capacitor 플러그인을 사용하거나, 서버 사이드에서 카카오 로그인을 처리하는 방법을 고려해야 합니다.

---

## 🔧 임시 해결책: 서버 사이드 카카오 로그인

모바일 앱에서는 카카오 JavaScript SDK 대신 서버 사이드에서 카카오 로그인을 처리하는 것이 더 안정적입니다.

### 구현 방법

1. 모바일 앱에서 카카오톡 앱으로 로그인 요청
2. 카카오톡 앱에서 인증 후 리다이렉트 URL로 돌아옴
3. 서버에서 인증 코드를 받아 액세스 토큰 교환
4. 사용자 정보 조회 및 로그인 처리

이 방법을 사용하려면:
- 카카오 개발자 콘솔에서 **리다이렉트 URI** 설정 필요
- Android: `walkstory://oauth` (커스텀 스킴)
- iOS: `walkstory://oauth` (커스텀 스킴)

---

## 📝 체크리스트

- [ ] 카카오 개발자 콘솔에 Android 플랫폼 추가
- [ ] 패키지 이름 `com.walkstory.app` 등록
- [ ] 키 해시 등록
- [ ] iOS 플랫폼 추가 (선택사항)
- [ ] 리다이렉트 URI 설정 (서버 사이드 로그인 사용 시)

---

## ⚠️ 중요 참고사항

현재 카카오 JavaScript SDK는 모바일 앱(WebView) 환경에서 제한적으로 작동합니다. 

**권장 사항:**
- **웹 브라우저**: JavaScript SDK 사용 가능
- **모바일 앱**: 네이티브 카카오 로그인 또는 서버 사이드 로그인 사용

가장 안정적인 방법은 서버 사이드에서 카카오 로그인을 처리하는 것입니다.
