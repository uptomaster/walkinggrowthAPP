# 안드로이드 스튜디오 APK 빌드 가이드

## ✅ 완료된 안드로이드 네이티브 설정

### 1. MainActivity.java 수정 완료
- 커스텀 URL 스킴 (`walkstory://oauth`) 처리 로직 추가
- `onNewIntent` 오버라이드하여 앱이 실행 중일 때도 URL 처리
- JavaScript로 URL 전달하여 프론트엔드에서 처리

### 2. AndroidManifest.xml 설정 완료
- 커스텀 URL 스킴 intent-filter 추가
- 인터넷 권한 설정
- 네트워크 보안 설정

### 3. 네트워크 보안 설정 완료
- Vercel 도메인 허용
- HTTPS 연결 강제

## 🚀 안드로이드 스튜디오에서 APK 빌드 방법

### 방법 1: Gradle을 사용한 명령줄 빌드 (권장)

**프로젝트 루트에서:**

```bash
cd android
.\gradlew assembleDebug
```

빌드된 APK 위치:
```
android/app/build/outputs/apk/debug/WalkStory-debug.apk
```

**릴리즈 APK 빌드:**
```bash
cd android
.\gradlew assembleRelease
```

빌드된 APK 위치:
```
android/app/build/outputs/apk/release/WalkStory-release.apk
```

### 방법 2: 안드로이드 스튜디오 GUI 사용

1. **안드로이드 스튜디오 열기**
   - `android` 폴더를 프로젝트로 열기

2. **빌드 메뉴 사용**
   - 상단 메뉴: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - 또는 오른쪽 사이드바 **Gradle** 탭:
     - `android` → `Tasks` → `build` → `assembleDebug` 더블클릭

3. **빌드 완료 후**
   - 하단에 알림 표시
   - **locate** 클릭하여 APK 파일 위치 확인

## 📝 빌드 전 확인 사항

### 1. Capacitor 동기화 확인

```bash
npm run cap sync android
```

또는:

```bash
npx cap sync android
```

### 2. 웹 파일 준비 확인

```bash
npm run prepare
```

또는:

```bash
node scripts/prepare-www.js
```

### 3. Gradle 빌드 설정 확인

`android/app/build.gradle` 확인:
- `applicationId`: `com.walkstory.app`
- `versionCode`: 1
- `versionName`: "1.0.0"

## 🔧 빌드 오류 해결

### 오류 1: "SDK location not found"

**해결:**
`android/local.properties` 파일 생성:
```properties
sdk.dir=C\:\\Users\\User\\AppData\\Local\\Android\\Sdk
```
(실제 SDK 경로로 변경)

### 오류 2: "Failed to resolve: capacitor-android"

**해결:**
```bash
cd android
.\gradlew clean
cd ..
npm run cap sync android
```

### 오류 3: "Manifest merger failed"

**해결:**
`android/app/src/main/AndroidManifest.xml` 확인:
- 중복된 권한 제거
- 올바른 패키지 이름 확인

## 📦 APK 설치 방법

### 방법 1: USB 디버깅

1. 안드로이드 기기에서 **개발자 옵션** 활성화
2. **USB 디버깅** 활성화
3. USB로 PC에 연결
4. 다음 명령어 실행:
```bash
adb install android/app/build/outputs/apk/debug/WalkStory-debug.apk
```

### 방법 2: 직접 전송

1. APK 파일을 안드로이드 기기로 전송 (이메일, 클라우드 등)
2. 기기에서 파일 관리자로 APK 열기
3. **알 수 없는 출처** 허용 (필요시)
4. 설치 진행

## ⚠️ 중요 사항

1. **디버그 APK**: 테스트용 (`assembleDebug`)
   - 서명: 자동 생성된 디버그 키스토어
   - 카카오 키 해시: 디버그 키스토어의 SHA1 사용

2. **릴리즈 APK**: 배포용 (`assembleRelease`)
   - 서명: 별도 생성 필요
   - 카카오 키 해시: 릴리즈 키스토어의 SHA1 사용

3. **카카오 개발자 콘솔 설정**
   - 네이티브 앱키에 Android 플랫폼 등록 필수
   - 디버그 키 해시: `61F95D5037CA3D777992B6EAD6625D5C9F2E048`
   - 리다이렉트 URI: `https://walkinggrowth-app.vercel.app/api/auth/kakao-callback`

## 🎯 빠른 빌드 체크리스트

- [ ] `npm run prepare` 실행 (웹 파일 준비)
- [ ] `npm run cap sync android` 실행 (Capacitor 동기화)
- [ ] 안드로이드 스튜디오에서 프로젝트 열기
- [ ] `Build` → `Build APK(s)` 실행
- [ ] APK 파일 확인 및 설치

## 💡 팁

- **빠른 빌드**: `.\gradlew assembleDebug` 명령어 사용
- **클린 빌드**: `.\gradlew clean assembleDebug`
- **빌드 캐시 삭제**: `.\gradlew clean` 후 다시 빌드
