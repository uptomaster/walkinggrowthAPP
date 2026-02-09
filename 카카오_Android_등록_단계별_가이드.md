# 카카오 Android 플랫폼 등록 단계별 가이드

## 📍 현재 상황

카카오 개발자 콘솔의 "플랫폼 키" 페이지를 보고 계시는데, **Android 플랫폼 등록은 다른 페이지에서 해야 합니다!**

⚠️ **카카오 개발자 콘솔 UI가 업데이트되면서 메뉴 위치가 변경되었을 수 있습니다.**

---

## ✅ 올바른 경로

### 1단계: 올바른 메뉴 찾기

카카오 개발자 콘솔의 메뉴 구조가 변경되었을 수 있습니다. 다음을 시도해보세요:

**방법 1: 앱 설정 메뉴에서 찾기**
1. 카카오 개발자 콘솔 접속
2. 왼쪽 사이드바에서 **"앱 설정"** 클릭
3. 아래 메뉴들 중에서 찾기:
   - **"플랫폼"** 또는
   - **"플랫폼 설정"** 또는
   - **"앱 플랫폼"** 또는
   - **"플랫폼 등록"**

**방법 2: 제품 설정에서 찾기**
1. 왼쪽 사이드바에서 **"제품 설정"** 클릭
2. **"카카오 로그인"** 클릭
3. 그 안에 **"플랫폼"** 또는 **"플랫폼 설정"** 메뉴가 있을 수 있습니다

**방법 3: 직접 URL 접속**
카카오 개발자 콘솔 URL이 다음과 같다면:
`https://developers.kakao.com/console/app/{앱키}/platform`

또는 직접 검색:
- 카카오 개발자 콘솔 상단 검색창에서 "플랫폼" 검색
- 또는 "Android" 검색

**참고**: 카카오 개발자 콘솔 UI가 업데이트되면서 메뉴 이름이 변경되었을 수 있습니다. "Android 플랫폼 등록" 또는 "앱 플랫폼" 같은 키워드로 찾아보세요.

### 2단계: 키 해시 생성

**방법 1: Gradle 사용 (가장 쉬움, 권장!)**

프로젝트 루트에서:

```bash
cd android
.\gradlew signingReport
```

출력에서 **SHA1** 값을 찾아 복사하세요. (예: `A1:B2:C3:D4:E5:...`)

**방법 2: Android Studio의 keytool 사용**

Android Studio가 설치되어 있다면:

```powershell
# Android Studio의 JDK 경로 사용
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

또는 Android Studio가 다른 위치에 설치되어 있다면:
- Android Studio 설치 폴더 → `jbr\bin\keytool.exe` 경로 찾기

**방법 3: Java JDK 설치 후 사용**

Java JDK가 설치되어 있다면:
```powershell
# JDK의 bin 폴더가 PATH에 있는지 확인
# 없다면 전체 경로 사용:
& "C:\Program Files\Java\jdk-XX\bin\keytool.exe" -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**출력 예시:**
```
인증서 지문:
         SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
         SHA256: AA:BB:CC:DD:EE:FF:...
```

**여기서 SHA1 값을 복사하세요!** (예: `A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0`)

### 3단계: Android 플랫폼 등록

1. **"플랫폼"** 페이지에서 오른쪽 상단의 **"플랫폼 추가"** 버튼 클릭
2. **"Android"** 선택
3. 다음 정보 입력:

   **패키지 이름:**
   ```
   com.walkstory.app
   ```
   - 정확히 입력해야 합니다!
   - 대소문자 구분합니다!

   **키 해시:**
   ```
   A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
   ```
   - 위에서 생성한 SHA1 값을 그대로 붙여넣으세요
   - 콜론(:) 포함해서 입력합니다

4. **"저장"** 버튼 클릭

---

## 🔍 페이지 구분하기

### ❌ 플랫폼 키 페이지 (현재 보고 계신 페이지)
- REST API 키, JavaScript 키, 네이티브 앱 키를 관리하는 곳
- **여기가 아닙니다!**

### ✅ 플랫폼 페이지 (여기로 가야 합니다!)
- Android, iOS, Web 플랫폼을 등록하는 곳
- 패키지 이름과 키 해시를 입력하는 곳
- **여기입니다!**

---

## 📸 화면 설명

**플랫폼 페이지에서 보이는 것:**
- 왼쪽에 "Android", "iOS", "Web" 탭 또는 목록
- 각 플랫폼별로 "추가" 또는 "등록" 버튼
- Android를 선택하면:
  - 패키지 이름 입력 필드
  - 키 해시 입력 필드
  - 저장 버튼

---

## ⚠️ 주의사항

1. **패키지 이름 정확히 입력**: `com.walkstory.app` (대소문자 구분)
2. **키 해시 형식**: 콜론 포함해서 입력 (예: `A1:B2:C3:...`)
3. **개발용 키 해시**: 지금은 디버그 키스토어의 SHA1 사용
4. **프로덕션용**: 나중에 서명 키의 SHA1도 추가로 등록 필요

---

## 🎯 빠른 체크리스트

- [ ] "플랫폼" 페이지로 이동 (플랫폼 키 페이지 아님!)
- [ ] 키 해시 생성 완료
- [ ] SHA1 값 복사 완료
- [ ] Android 플랫폼 추가 클릭
- [ ] 패키지 이름 `com.walkstory.app` 입력
- [ ] 키 해시 붙여넣기
- [ ] 저장 클릭

---

## 💡 여전히 찾기 어려우시면

카카오 개발자 콘솔에서:
1. 왼쪽 메뉴에서 **"앱 설정"** 찾기
2. 그 아래에 **"플랫폼"** 메뉴 찾기
3. 클릭하면 Android/iOS/Web 플랫폼을 등록할 수 있는 페이지가 나옵니다
