# WalkStory 모바일 앱 빠른 시작 가이드

## 🚀 빠른 빌드 및 테스트

### 1. 웹 파일 준비

```bash
npm run prepare-android
```

### 2. Capacitor 동기화

```bash
npx cap sync
```

### 3. Android Studio에서 실행

```bash
npm run cap:android
```

또는

```bash
npx cap open android
```

Android Studio가 열리면:
1. 에뮬레이터 또는 실제 기기 선택
2. **Run** 버튼 클릭 (▶️)

### 4. iOS에서 실행 (macOS만)

```bash
npm run cap:ios
```

Xcode가 열리면:
1. 시뮬레이터 또는 실제 기기 선택
2. **Run** 버튼 클릭 (▶️)

---

## 📦 프로덕션 빌드

### Android AAB 빌드 (Google Play용)

```bash
npm run build:android:bundle
```

빌드된 파일: `android/app/release/app-release.aab`

### Android APK 빌드 (직접 설치용)

```bash
npm run build:android
```

빌드된 파일: `android/app/release/WalkStory-release.apk`

---

## ⚠️ 중요 사항

### 패키지 ID 변경 안내

앱의 패키지 ID가 `com.pedometer.app`에서 `com.walkstory.app`으로 변경되었습니다.

**기존에 테스트 설치한 앱이 있다면:**
- 기존 앱을 삭제한 후 새로 설치해야 합니다.
- 또는 Android Studio에서 **Uninstall** 후 다시 설치하세요.

---

## 📱 다음 단계

정식 출시를 원하시면 `MOBILE_APP_출시_가이드.md` 파일을 참고하세요.
