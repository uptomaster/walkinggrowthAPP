# APK 테스트 환경 설정 가이드

## 🔧 현재 상황

APK를 직접 다운로드해서 테스트하고 있는 환경입니다.

## ✅ 해결 방법

### 1. 카카오 로그인 설정 (APK 테스트용)

#### 1-1. 개발용 키 해시 생성

**방법 1: Gradle 사용 (가장 쉬움, 권장!)**

프로젝트 폴더에서:
```powershell
cd android
.\gradlew signingReport
```

출력에서 **SHA1** 값을 찾아 복사합니다. (예: `A1:B2:C3:D4:E5:...`)

**방법 2: Android Studio의 keytool 사용**

Android Studio가 설치되어 있다면:
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Android Studio가 다른 위치에 있다면 실제 경로로 변경하세요.

**방법 3: Android Studio GUI 사용**

1. Android Studio에서 프로젝트 열기
2. 오른쪽 사이드바 **Gradle** 탭 클릭
3. `android` → `Tasks` → `android` → `signingReport` 더블클릭
4. 하단 **Run** 탭에서 SHA1 값 확인

#### 1-2. 카카오 개발자 콘솔 설정

⚠️ **중요**: "플랫폼 키" 페이지가 아니라 **"플랫폼"** 페이지로 가야 합니다!

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. **내 애플리케이션** → **WalkStory** 앱 선택
3. 왼쪽 메뉴에서 **앱 설정** → **플랫폼** 클릭
   - ⚠️ "플랫폼 키"가 아니라 **"플랫폼"**입니다!
4. 오른쪽 상단에 **플랫폼 추가** 버튼 클릭
5. **Android** 선택
6. 다음 정보 입력:
   - **패키지 이름**: `com.walkstory.app` (정확히 입력!)
   - **키 해시**: 아래에서 생성한 SHA1 값 입력 (콜론 제거, 예: `A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0`)
7. **저장** 클릭

**참고**: 
- "플랫폼 키" 페이지는 API 키를 관리하는 곳입니다
- "플랫폼" 페이지는 Android/iOS/Web 플랫폼을 등록하는 곳입니다
- 두 페이지는 다릅니다!

### 2. 네트워크 오류 해결

APK에서 네트워크 오류가 발생하는 경우:

#### 2-1. 인터넷 권한 확인

`android/app/src/main/AndroidManifest.xml`에 다음 권한이 있는지 확인:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

#### 2-2. API_BASE 확인

앱 실행 시 콘솔 로그에서 다음을 확인:
- `API_BASE 설정 완료` 로그 확인
- `API_BASE` 값이 `https://walkinggrowth-app.vercel.app`인지 확인

#### 2-3. 네트워크 보안 설정 확인

`android/app/src/main/res/xml/network_security_config.xml` 파일 확인:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>
```

### 3. APK 빌드 및 테스트

#### 3-1. 디버그 APK 빌드

```bash
cd android
./gradlew assembleDebug
```

빌드된 APK: `android/app/build/outputs/apk/debug/WalkStory-debug.apk`

#### 3-2. 디바이스에 설치

```bash
adb install android/app/build/outputs/apk/debug/WalkStory-debug.apk
```

또는 APK 파일을 직접 전송하여 설치

### 4. 문제 해결 체크리스트

- [ ] 카카오 개발자 콘솔에 Android 플랫폼 등록 완료
- [ ] 패키지 이름 `com.walkstory.app` 정확히 입력
- [ ] 개발용 키 해시(SHA1) 등록 완료
- [ ] 인터넷 권한 확인
- [ ] API_BASE가 올바르게 설정되는지 확인 (콘솔 로그)
- [ ] Vercel 서버가 정상 작동하는지 확인 (웹 브라우저에서 테스트)

### 5. 디버깅 팁

#### 콘솔 로그 확인

Android Studio의 Logcat에서 다음을 확인:
- `API_BASE 설정 완료` 로그
- `모바일 앱 감지됨` 로그
- 네트워크 오류 상세 메시지

#### Chrome DevTools 사용

1. Chrome에서 `chrome://inspect` 접속
2. 디바이스 연결 후 **inspect** 클릭
3. Console 탭에서 JavaScript 오류 확인

---

## 🚨 자주 발생하는 문제

### 문제 1: 카카오 로그인 KOE009 오류

**원인**: 카카오 개발자 콘솔에 Android 플랫폼이 등록되지 않음

**해결**: 위의 1-2 단계 참고

### 문제 2: 네트워크 오류

**원인 1**: API_BASE가 설정되지 않음
- 콘솔 로그 확인
- `isMobileApp` 감지 로직 확인

**원인 2**: 인터넷 권한 없음
- AndroidManifest.xml 확인

**원인 3**: Vercel 서버 문제
- 웹 브라우저에서 직접 테스트

### 문제 3: CSS가 적용되지 않음

**원인**: `prepare-www.js`가 CSS 파일을 복사하지 않음

**해결**: 
```bash
npm run prepare-android
npx cap sync
```

---

## 📱 테스트 순서

1. **웹 파일 준비**
   ```bash
   npm run prepare-android
   ```

2. **Capacitor 동기화**
   ```bash
   npx cap sync
   ```

3. **APK 빌드**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **디바이스에 설치**
   ```bash
   adb install app/build/outputs/apk/debug/WalkStory-debug.apk
   ```

5. **테스트**
   - 앱 실행
   - 콘솔 로그 확인
   - 로그인 테스트
   - 기능 테스트

---

## 💡 추가 팁

- **개발 중**: 디버그 키 해시 사용
- **프로덕션**: 서명 키의 해시도 등록 필요
- **카카오 로그인**: 모바일 앱에서는 제한적으로 작동할 수 있음 (일반 로그인 사용 권장)
