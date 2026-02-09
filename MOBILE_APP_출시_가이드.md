# WalkStory 모바일 앱 정식 출시 가이드

## 📱 앱 정보

- **앱 이름**: WalkStory
- **패키지 ID**: `com.walkstory.app`
- **설명**: 걸음으로 키우는 나만의 동물 친구

---

## 🚀 1. 사전 준비

### 필수 요구사항

1. **Node.js** (v18 이상)
2. **Android Studio** (Android 개발용)
3. **Xcode** (iOS 개발용, macOS만)
4. **Google Play Console 계정** ($25 등록비)
5. **Apple Developer 계정** ($99/년, iOS 출시 시)

---

## 📦 2. 빌드 준비

### 2.1 의존성 설치

```bash
npm install
```

### 2.2 웹 파일 빌드

```bash
npm run prepare-android
```

이 명령은 `walk-growth.html`, `app.js`, `styles.css` 등을 `www` 폴더로 복사합니다.

### 2.3 Capacitor 동기화

```bash
npx cap sync
```

---

## 🤖 3. Android 출시 (Google Play Store)

### 3.1 서명 키 생성 (최초 1회)

```bash
keytool -genkey -v -keystore walkstory-release.keystore -alias walkstory -keyalg RSA -keysize 2048 -validity 10000
```

**중요**: 키 파일과 비밀번호는 절대 분실하지 마세요!

### 3.2 서명 설정 파일 생성

`android/key.properties` 파일 생성:

```properties
storeFile=../walkstory-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=walkstory
keyPassword=YOUR_KEY_PASSWORD
```

### 3.3 build.gradle 수정

`android/app/build.gradle` 파일에 서명 설정 추가 (이미 있을 수 있음):

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3.4 AAB 빌드

Android Studio에서:
1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** 선택
3. 서명 키 선택 또는 생성
4. **release** 빌드 타입 선택
5. 빌드 완료 후 `android/app/release/app-release.aab` 파일 생성

또는 명령줄에서:

```bash
cd android
./gradlew bundleRelease
```

### 3.5 Google Play Console 업로드

1. [Google Play Console](https://play.google.com/console) 접속
2. **앱 만들기** 클릭
3. 앱 정보 입력:
   - **앱 이름**: WalkStory
   - **기본 언어**: 한국어
   - **앱 또는 게임**: 앱
   - **무료 또는 유료**: 무료
4. **앱 번들 업로드**: `app-release.aab` 파일 업로드
5. **스토어 등록정보** 작성:
   - 짧은 설명: "걸음으로 키우는 나만의 동물 친구"
   - 전체 설명: 상세 설명 작성
   - 스크린샷: 최소 2개 (필수)
   - 아이콘: 512x512 PNG
   - 기능 그래픽: 선택사항
6. **콘텐츠 등급** 설정
7. **대상 지역** 선택
8. **출시 검토** 제출

---

## 🍎 4. iOS 출시 (App Store)

### 4.1 iOS 플랫폼 추가

```bash
npx cap add ios
npx cap sync ios
```

### 4.2 Xcode에서 프로젝트 열기

```bash
npx cap open ios
```

### 4.3 앱 설정

1. Xcode에서 프로젝트 선택
2. **General** 탭:
   - **Display Name**: WalkStory
   - **Bundle Identifier**: `com.walkstory.app`
   - **Version**: 1.0.0
   - **Build**: 1
3. **Signing & Capabilities**:
   - **Team** 선택 (Apple Developer 계정 필요)
   - **Automatically manage signing** 체크

### 4.4 권한 설정

`Info.plist`에 다음 권한 추가:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>산책 거리 측정을 위해 위치 정보가 필요합니다.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>산책 거리 측정을 위해 위치 정보가 필요합니다.</string>
```

### 4.5 아카이브 및 업로드

1. Xcode에서 **Product → Archive**
2. 아카이브 완료 후 **Distribute App** 선택
3. **App Store Connect** 선택
4. 업로드 완료

### 4.6 App Store Connect 설정

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. **내 앱** → **앱 만들기**
3. 앱 정보 입력:
   - **이름**: WalkStory
   - **기본 언어**: 한국어
   - **번들 ID**: `com.walkstory.app`
4. **앱 정보** 작성:
   - 카테고리: 건강 및 피트니스
   - 연령 등급: 4+
5. **가격 및 판매 범위** 설정
6. **버전 정보** 작성:
   - 스크린샷: 필수
   - 설명: 상세 설명
   - 키워드: 산책, 걸음, 동물, 성장 등
7. **제출 검토** 클릭

---

## 🔧 5. 업데이트 배포

### 5.1 버전 업데이트

**Android** (`android/app/build.gradle`):
```gradle
versionCode 2  // 이전보다 큰 숫자
versionName "1.0.1"
```

**iOS** (Xcode):
- **Version**: 1.0.1
- **Build**: 2

### 5.2 빌드 및 업로드

1. 코드 변경 후 `npm run prepare-android` 실행
2. `npx cap sync` 실행
3. 새 AAB/IPA 빌드
4. 각 스토어에 업로드

---

## 📋 6. 체크리스트

### 출시 전 확인사항

- [ ] 앱 아이콘 설정 완료
- [ ] 스플래시 스크린 설정 완료
- [ ] 권한 요청 메시지 설정 완료
- [ ] 개인정보 처리방침 작성 및 링크 추가
- [ ] 이용약관 작성 및 링크 추가
- [ ] 스크린샷 준비 (최소 2개)
- [ ] 앱 설명 작성
- [ ] 버전 번호 확인
- [ ] 테스트 빌드로 모든 기능 확인

### 필수 권한

- **위치 정보** (필수): 산책 거리 측정
- **인터넷** (필수): 서버 통신

---

## 🐛 7. 문제 해결

### Android 빌드 오류

- **Gradle 버전 확인**: `android/gradle/wrapper/gradle-wrapper.properties`
- **SDK 버전 확인**: `android/app/build.gradle`의 `compileSdkVersion`

### iOS 빌드 오류

- **CocoaPods 설치**: `cd ios && pod install`
- **서명 오류**: Xcode에서 Team 설정 확인

### 런타임 오류

- **API 연결 실패**: `capacitor.config.json`의 `server` 설정 확인
- **권한 오류**: `AndroidManifest.xml` 및 `Info.plist` 확인

---

## 📞 8. 지원

문제가 발생하면:
1. 콘솔 로그 확인
2. Capacitor 문서 참조: https://capacitorjs.com/docs
3. 각 스토어의 개발자 가이드 참조

---

## 🎉 출시 완료!

모든 단계를 완료하면 WalkStory가 정식으로 출시됩니다!
