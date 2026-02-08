# 산책 성장기 · 정식 배포 가이드 (Google Play)

## 1. APK/앱 이름 변경 (완료)

- **홈 화면에 보이는 이름**: `android/app/src/main/res/values/strings.xml` 의 `app_name` → **"산책 성장기"** 로 설정해 두었어요.
- **빌드되는 APK 파일 이름**: `app/build.gradle` 에서 **WalkGrowth-debug.apk** / **WalkGrowth-release.apk** 로 나가도록 설정해 두었어요.

다른 이름으로 바꾸고 싶다면:
- **앱 이름**: `android/app/src/main/res/values/strings.xml` 에서 `app_name`, `title_activity_main` 값만 원하는 이름으로 수정하면 됩니다.
- **APK 파일명**: `android/app/build.gradle` 안의 `"WalkGrowth-${variant.name}.apk"` 를 원하는 이름으로 바꾸면 됩니다.

---

## 2. 정식 배포 (Google Play 스토어)

### 필요 조건

1. **Google Play 개발자 계정**  
   - [Google Play Console](https://play.google.com/console) 가입  
   - **등록비 1회 $25** (약 3만 원대)

2. **서명 키 생성** (최초 1번)  
   - 정식 배포용 앱은 **서명된 AAB(Android App Bundle)** 로 올려야 합니다.

### 단계 요약

#### Step 1. 서명 키 만들기

```bash
keytool -genkey -v -keystore walk-growth-release.keystore -alias walk-growth -keyalg RSA -keysize 2048 -validity 10000
```

- 비밀번호 두 번 입력, 이름/조직 등 입력 후 `walk-growth-release.keystore` 파일이 생성됩니다.
- **이 파일과 비밀번호는 절대 분실하면 안 됩니다.** 분실 시 같은 패키지로 업데이트 불가.

#### Step 2. Android Studio에서 서명된 번들 생성

1. **Build → Generate Signed Bundle / APK** 선택  
2. **Android App Bundle** 선택 후 Next  
3. **Create new...** 또는 기존 keystore 선택  
   - 기존 키 사용 시: 방금 만든 `walk-growth-release.keystore` 경로, alias, 비밀번호 입력  
4. **release** 빌드 타입 선택 후 Finish  
5. 빌드가 끝나면 `android/app/release/app-release.aab` (또는 안내된 경로)에 **.aab** 파일이 생성됩니다.

#### Step 3. Play Console에서 앱 등록

1. [Play Console](https://play.google.com/console) 로그인  
2. **앱 만들기** → 앱 이름(예: 산책 성장기), 기본 언어 등 입력  
3. **앱 액세스 권한**, **광고 여부**(있으면 예/아니오), **콘텐츠 등급**, **대상 지역** 등 단계별로 입력  
4. **프로덕션** (또는 테스트 트랙)에서 **앱 번들 업로드**  
   - Step 2에서 만든 **.aab** 파일 업로드  
5. **스토어 등록정보** 작성  
   - 짧은 설명, 전체 설명, 스크린샷(필수), 아이콘, 기능 그래픽 등  
6. 모든 항목이 완료되면 **출시 검토** 제출  
   - 검토 통과 후 선택한 국가/지역에 정식 배포됩니다.

### 참고

- **applicationId** (`com.pedometer.app`) 는 스토어에서 앱을 구분하는 고유 ID입니다. 한 번 배포한 뒤에는 변경하지 않는 것이 좋습니다.
- 첫 출시 후 **업데이트**는 `versionCode`를 올리고 새 AAB를 업로드하면 됩니다. (`android/app/build.gradle` 의 `versionCode`, `versionName` 수정)

---

## 3. 요약

| 항목 | 설명 |
|------|------|
| **앱 이름** | `strings.xml` 의 `app_name` → 현재 "산책 성장기" |
| **APK 파일명** | `WalkGrowth-debug.apk` / `WalkGrowth-release.apk` |
| **정식 배포** | Play Console 가입 → 서명 키 생성 → AAB 빌드 → 콘솔에서 업로드 및 스토어 정보 입력 → 출시 검토 |

이름만 바꿀 때는 **strings.xml** 과 **build.gradle** 의 출력 파일명만 수정하면 됩니다. 정식 배포는 위 순서대로 진행하면 됩니다.
