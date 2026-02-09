# 🚶 WalkStory - 걸음으로 키우는 나만의 동물 친구

<div align="center">

![WalkStory Logo](./walkstory-logo.png)

**걸음으로 성장하는 산책 앱 게임**

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://walkinggrowth-app.vercel.app)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-blue?logo=capacitor)](https://capacitorjs.com)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

[웹 앱 체험하기](https://walkinggrowth-app.vercel.app/walk-growth.html) | [모바일 앱 다운로드](#-모바일-앱-빌드)

</div>

---

## 📖 프로젝트 소개

**WalkStory**는 일상의 걸음을 게임화하여 동물 친구를 키우는 산책 앱입니다. 실제 걸음 수를 활용해 가상의 동물을 성장시키고, 친구들과 함께 파티를 만들어 경험치 보너스를 받으며, 다양한 코스와 퀘스트를 완료하는 재미있는 경험을 제공합니다.

### 핵심 컨셉
- 🚶 **실제 걸음 수 기반 게임플레이**: 만보기 연동으로 실제 걸음이 게임 내 경험치로 전환
- 🐾 **동물 키우기**: 걸음으로 동물 친구를 성장시키고 다양한 종류 수집
- 👥 **소셜 기능**: 친구 추가, 파티 구성, 채팅으로 함께 성장
- 🎮 **게임 요소**: 출석 체크, 퀘스트, 코스 완주, 아이템 수집 등

---

## ✨ 주요 기능

### 🎮 게임 기능

#### 1. 동물 키우기 시스템
- **걸음 수 기반 성장**: 실제 걸음 수가 경험치로 전환되어 동물이 성장
- **다양한 동물 종류**: 야생 동물 발견 및 포획 시스템
- **동물 수집**: 다양한 동물을 수집하고 관리하는 도감 시스템
- **파트너 시스템**: 동물과의 친밀도 포인트 시스템

#### 2. 만보기 연동
- **실시간 걸음 수 추적**: 디바이스의 만보기 센서 활용
- **일일 목표**: 10,000보 목표 달성 시 보상
- **평생 걸음 수**: 누적 걸음 수 추적 및 통계

#### 3. 출석 체크 시스템
- **일일 출석 보상**: 매일 로그인 시 골드 지급 (연속 출석 시 증가)
- **7일 연속 출석**: 특별 보상 상자 제공
- **출석 연속 기록**: 최대 연속 출석 일수 추적

#### 4. 퀘스트 시스템
- **일일 퀘스트**: 매일 새로운 목표 제공
- **퀘스트 진행도 추적**: 실시간 진행 상황 확인
- **보상 시스템**: 퀘스트 완료 시 골드 및 경험치 지급

#### 5. 코스/루트 시스템
- **사용자 생성 코스**: 자신만의 산책 코스 생성 및 공유
- **코스 완주**: 코스 목표 거리 달성 시 보상
- **과거 기록과 경쟁**: 이전 자신의 기록과 비교

#### 6. 인벤토리 및 아이템
- **장비 시스템**: 다양한 장비 아이템 수집 및 장착
- **인벤토리 관리**: 아이템 보관 및 관리
- **코덱스 시스템**: 수집한 장비 기록

#### 7. 골드 및 경제 시스템
- **골드 획득**: 걸음, 출석, 퀘스트 완료로 골드 획득
- **골드 사용**: 아이템 구매 및 다양한 용도로 활용

### 👥 소셜 기능

#### 1. 친구 시스템
- **친구 추가**: 닉네임으로 친구 검색 및 추가
- **친구 목록**: 추가한 친구 목록 확인
- **친구 걸음 수 확인**: 친구의 실시간 걸음 수 및 활동 상태 확인
- **프로필 보기**: 친구의 프로필 및 통계 확인

#### 2. 파티 시스템
- **파티 생성**: 최대 4명의 파티 구성
- **파티 초대**: 친구를 파티에 초대
- **경험치 보너스**: 파티 멤버와 함께 걸을 때 경험치 보너스 획득
- **파티 관리**: 파티 해체 및 멤버 관리

#### 3. 채팅 시스템
- **실시간 채팅**: 친구 및 파티 멤버와 채팅
- **채팅 히스토리**: 이전 대화 내용 확인
- **알림 시스템**: 새 메시지 알림

#### 4. 프로필 시스템
- **사용자 프로필**: 닉네임, 아바타, 칭호 등
- **통계 확인**: 총 걸음 수, 총 거리, 레벨 등
- **공개 프로필**: 다른 사용자가 볼 수 있는 프로필

### 🔐 인증 및 보안

#### 1. 회원가입 및 로그인
- **일반 회원가입**: 닉네임과 비밀번호로 가입
- **소셜 로그인**: 카카오, 구글 로그인 지원
- **비밀번호 재설정**: 이메일 기반 비밀번호 재설정
- **아이디 찾기**: 닉네임 기반 계정 찾기

#### 2. 데이터 동기화
- **클라우드 저장**: Supabase를 통한 데이터 동기화
- **다중 기기 지원**: 여러 기기에서 동일한 계정 사용 가능
- **자동 백업**: 실시간 데이터 저장 및 복원

---

## 🛠 기술 스택

### Frontend
- **HTML5/CSS3/JavaScript (Vanilla)**: 순수 JavaScript로 구현된 프론트엔드
- **PWA (Progressive Web App)**: 오프라인 지원 및 앱처럼 사용 가능
- **Service Worker**: 오프라인 캐싱 및 백그라운드 동기화
- **LocalStorage**: 클라이언트 측 데이터 저장
- **Kakao SDK**: 카카오 소셜 로그인 (웹)
- **Google OAuth**: 구글 소셜 로그인

### Backend
- **Node.js**: 서버 사이드 런타임
- **Express.js**: 웹 프레임워크
- **Vercel Serverless Functions**: 서버리스 API 엔드포인트
- **JWT (JSON Web Token)**: 인증 토큰 관리
- **bcrypt**: 비밀번호 해싱
- **PostgreSQL**: 관계형 데이터베이스

### Database
- **Supabase (PostgreSQL)**: 클라우드 데이터베이스 서비스
  - `users`: 사용자 정보
  - `user_data`: 게임 데이터 (JSON)
  - `friends`: 친구 관계
  - `chats`: 채팅 메시지
  - `parties`: 파티 정보

### Mobile App
- **Capacitor 8.0**: 하이브리드 모바일 앱 프레임워크
- **Android**: 네이티브 Android 앱 빌드
- **iOS**: 네이티브 iOS 앱 빌드 (준비됨)
- **Custom URL Scheme**: `walkstory://oauth` OAuth 리다이렉트

### 배포 및 인프라
- **Vercel**: 프론트엔드 및 서버리스 함수 배포
- **GitHub**: 버전 관리 및 CI/CD
- **Android Studio**: Android 앱 빌드
- **Xcode**: iOS 앱 빌드 (준비됨)

### 개발 도구
- **Cursor AI**: AI 기반 코드 에디터로 개발
- **npm**: 패키지 관리
- **Gradle**: Android 빌드 도구
- **Git**: 버전 관리

---

## 🚀 개발 과정

### Cursor AI를 활용한 개발

이 프로젝트는 **Cursor AI**를 활용하여 개발되었습니다. Cursor는 AI 기반 코드 에디터로, 자연어로 요청하면 코드를 자동 생성하고 수정해주는 강력한 도구입니다.

#### Cursor 활용 사례

1. **초기 프로젝트 구조 설계**
   - 게임 로직, API 구조, 데이터베이스 스키마 설계
   - 파일 구조 및 모듈 분리 제안

2. **기능 구현**
   - 만보기 연동 로직 구현
   - 친구 시스템, 파티 시스템, 채팅 기능 구현
   - 출석 체크, 퀘스트 시스템 구현

3. **모바일 앱 변환**
   - 웹 앱을 Capacitor 기반 모바일 앱으로 변환
   - Android 네이티브 코드 작성 (MainActivity.java)
   - 카카오 로그인 서버 사이드 OAuth 구현

4. **문제 해결**
   - Vercel 서버리스 함수 제한 문제 해결 (15개 → 12개)
   - 카카오 로그인 KOE009 오류 해결
   - Android 빌드 오류 해결 (Java 버전, SDK 호환성)

5. **문서화**
   - 가이드 문서 자동 생성
   - API 문서화
   - 문제 해결 가이드 작성

#### Cursor의 장점
- **빠른 프로토타이핑**: 아이디어를 빠르게 코드로 구현
- **코드 리뷰**: 버그 발견 및 개선 제안
- **리팩토링**: 코드 구조 개선 및 최적화
- **문서 생성**: 자동으로 주석 및 문서 생성

### 개발 타임라인

1. **Phase 1: 웹 앱 개발**
   - 기본 게임 로직 구현
   - 만보기 연동
   - 사용자 인증 시스템

2. **Phase 2: 소셜 기능 추가**
   - 친구 시스템
   - 파티 시스템
   - 채팅 기능

3. **Phase 3: 모바일 앱 변환**
   - Capacitor 설정
   - Android 빌드 설정
   - 네이티브 기능 통합

4. **Phase 4: 배포 및 최적화**
   - Vercel 배포
   - 서버리스 함수 최적화
   - 모바일 앱 빌드 및 테스트

---

## 📦 설치 및 실행

### 사전 요구사항

- **Node.js** 18.x 이상
- **npm** 9.x 이상
- **Git**
- **Supabase 계정** (데이터베이스용)
- **카카오 개발자 계정** (소셜 로그인용, 선택사항)

### 로컬 개발 환경 설정

#### 1. 저장소 클론

```bash
git clone https://github.com/uptomaster/walkinggrowthAPP.git
cd walkinggrowthAPP
```

#### 2. 의존성 설치

```bash
# 루트 디렉토리
npm install

# 서버 디렉토리
cd server
npm install
cd ..
```

#### 3. 환경 변수 설정

**서버 환경 변수** (`server/.env`):

```bash
cd server
cp env.example .env
```

`.env` 파일 편집:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
KAKAO_REST_API_KEY=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
```

**프론트엔드 설정** (`config.js`):

```bash
cp config.js.example config.js
```

`config.js` 편집:
```javascript
window.APP_CONFIG = {
  apiBase: 'http://localhost:3000',
  kakao: {
    javascriptKey: 'your-kakao-javascript-key'
  }
};
```

#### 4. 서버 실행

```bash
cd server
npm start
```

서버는 `http://localhost:3000`에서 실행됩니다.

#### 5. 프론트엔드 실행

```bash
# 루트 디렉토리에서
npm start
```

또는 정적 파일 서버 사용:
```bash
npx serve -p 8080
```

브라우저에서 `http://localhost:8080/walk-growth.html` 접속

---

## 🌐 배포

### Vercel 배포 (권장)

#### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. **Add New → Project** 선택
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd server && npm install`
   - **Output Directory**: `./`

#### 2. 환경 변수 설정

Vercel 대시보드 → **Settings → Environment Variables**에서 다음 변수 추가:

- `JWT_SECRET`: 강한 랜덤 문자열 (예: `openssl rand -base64 32`)
- `DATABASE_URL`: Supabase PostgreSQL 연결 URI
- `KAKAO_REST_API_KEY`: 카카오 REST API 키
- `KAKAO_CLIENT_SECRET`: 카카오 클라이언트 시크릿 (선택사항)

#### 3. 배포 확인

배포 완료 후 `https://your-project.vercel.app/walk-growth.html` 접속하여 확인

### Render 배포 (대안)

자세한 내용은 [DEPLOY.md](./DEPLOY.md) 참고

---

## 📱 모바일 앱 빌드

### Android 앱 빌드

#### 사전 요구사항

- **Android Studio** 설치
- **Java JDK 21** 설치
- **Android SDK 36** 설치
- **카카오 개발자 콘솔** 설정 완료

#### 1. Capacitor 설정

```bash
# www 폴더 준비
npm run prepare-android

# Capacitor 동기화
npm run cap:sync
```

#### 2. Android Studio에서 빌드

```bash
# Android Studio 열기
npm run cap:android
```

또는 수동으로:
```bash
cd android
./gradlew assembleDebug  # 디버그 APK
./gradlew assembleRelease # 릴리즈 APK
```

#### 3. APK 위치

- 디버그: `android/app/build/outputs/apk/debug/app-debug.apk`
- 릴리즈: `android/app/build/outputs/apk/release/app-release.apk`

자세한 내용은 [안드로이드_스튜디오_APK_빌드_가이드.md](./안드로이드_스튜디오_APK_빌드_가이드.md) 참고

### iOS 앱 빌드 (준비됨)

```bash
npm run cap:ios
```

자세한 내용은 [MOBILE_APP_출시_가이드.md](./MOBILE_APP_출시_가이드.md) 참고

---

## 📚 API 문서

### 인증 API

#### 회원가입
```http
POST /api/auth/signup
Content-Type: application/json

{
  "nickname": "사용자닉네임",
  "password": "비밀번호"
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "nickname": "사용자닉네임",
  "password": "비밀번호"
}

Response:
{
  "token": "jwt-token",
  "user": { "id": 1, "nickname": "사용자닉네임" }
}
```

#### 소셜 로그인 (카카오)
```http
GET /api/auth/kakao-oauth-start

Response:
{
  "authUrl": "https://kauth.kakao.com/oauth/authorize?..."
}
```

#### 비밀번호 재설정 요청
```http
POST /api/auth/reset-password-request
Content-Type: application/json

{
  "nickname": "사용자닉네임"
}
```

#### 비밀번호 재설정
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "password": "새비밀번호"
}
```

### 사용자 데이터 API

#### 게임 데이터 조회
```http
GET /api/user/data
Authorization: Bearer {token}

Response:
{
  "data": { /* 게임 데이터 JSON */ }
}
```

#### 게임 데이터 저장
```http
POST /api/user/data
Authorization: Bearer {token}
Content-Type: application/json

{
  "steps": 10000,
  "gold": 500,
  "inventory": [...],
  ...
}
```

#### 현재 사용자 정보
```http
GET /api/user/me
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "nickname": "사용자닉네임",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 친구 API

#### 친구 추가
```http
POST /api/friends
Authorization: Bearer {token}
Content-Type: application/json

{
  "friendNickname": "친구닉네임"
}
```

#### 친구 목록 조회
```http
GET /api/friends
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "nickname": "친구닉네임",
    "steps": 5000,
    "isWalking": true
  }
]
```

#### 친구 삭제
```http
DELETE /api/friends/:friendId
Authorization: Bearer {token}
```

### 파티 API

#### 파티 생성
```http
POST /api/party
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "파티이름"
}
```

#### 파티 조회
```http
GET /api/party
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "name": "파티이름",
  "members": [...],
  "xpBonus": 1.2
}
```

#### 파티 초대
```http
POST /api/party/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "friendId": 2
}
```

#### 파티 나가기
```http
DELETE /api/party
Authorization: Bearer {token}
```

### 채팅 API

#### 메시지 전송
```http
POST /api/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": 2,
  "message": "안녕하세요!"
}
```

#### 채팅 목록 조회
```http
GET /api/chat
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "message": "안녕하세요!",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

## 🔧 문제 해결

### 일반적인 문제

#### 1. Vercel 배포 시 함수 제한 오류
**문제**: "No more than 12 Serverless Functions can be added"
**해결**: 불필요한 함수 제거 또는 통합 (자세한 내용은 [Vercel_함수_제한_최종해결.md](./Vercel_함수_제한_최종해결.md) 참고)

#### 2. 카카오 로그인 오류 (KOE009)
**문제**: 모바일 앱에서 카카오 로그인 실패
**해결**: 서버 사이드 OAuth 구현 (자세한 내용은 [KOE009_최종해결_가이드.md](./KOE009_최종해결_가이드.md) 참고)

#### 3. Android 빌드 오류
**문제**: Java 버전 또는 SDK 호환성 오류
**해결**: Java 21 및 Android SDK 36 설정 (자세한 내용은 [Java21_설정_가이드.md](./Java21_설정_가이드.md) 참고)

#### 4. 네트워크 연결 오류
**문제**: 모바일 앱에서 API 호출 실패
**해결**: 
- `AndroidManifest.xml`에 인터넷 권한 확인
- `network_security_config.xml`에 도메인 추가
- `API_BASE` 설정 확인

### 추가 가이드

- [키해시_생성_가이드.md](./키해시_생성_가이드.md): 카카오 네이티브 앱키 등록용 키해시 생성
- [네이티브_앱키_등록_가이드.md](./네이티브_앱키_등록_가이드.md): 카카오 개발자 콘솔 설정
- [모바일_카카오_로그인_설정_가이드.md](./모바일_카카오_로그인_설정_가이드.md): 모바일 카카오 로그인 설정
- [안드로이드_빌드_완료_체크리스트.md](./안드로이드_빌드_완료_체크리스트.md): 빌드 전 확인사항
- [모바일_앱_테스트_체크리스트.md](./모바일_앱_테스트_체크리스트.md): 앱 테스트 가이드

---

## 📁 프로젝트 구조

```
walkinggrowthAPP/
├── api/                    # Vercel 서버리스 함수
│   ├── auth/              # 인증 관련 API
│   │   ├── login.js
│   │   ├── signup.js
│   │   ├── kakao-oauth.js
│   │   └── ...
│   ├── user/              # 사용자 데이터 API
│   ├── friends.js         # 친구 API
│   ├── party.js           # 파티 API
│   └── chat.js            # 채팅 API
├── android/                # Android 네이티브 코드
│   └── app/
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── java/com/walkstory/app/
│               └── MainActivity.java
├── server/                 # Express 서버 (로컬 개발용)
│   ├── auth.js
│   ├── data.js
│   ├── db.js
│   └── index.js
├── www/                    # Capacitor 빌드 출력 디렉토리
├── scripts/                # 빌드 스크립트
├── app.js                  # 메인 프론트엔드 로직
├── walk-growth.html        # 메인 HTML 파일
├── styles.css              # 스타일시트
├── config.js               # 설정 파일
├── capacitor.config.json   # Capacitor 설정
├── vercel.json             # Vercel 배포 설정
└── package.json            # 프로젝트 의존성
```

---

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 ISC 라이선스를 따릅니다.

---

## 👨‍💻 개발자

**이남혁**
- GitHub: [@uptomaster](https://github.com/uptomaster)
- 프로젝트: [walkinggrowthAPP](https://github.com/uptomaster/walkinggrowthAPP)

---

## 🙏 감사의 말

- **Cursor AI**: AI 기반 개발 도구로 빠른 프로토타이핑과 문제 해결
- **Capacitor**: 웹 기술로 네이티브 앱 개발 가능하게 해준 프레임워크
- **Vercel**: 쉬운 배포와 서버리스 함수 제공
- **Supabase**: 강력하고 사용하기 쉬운 데이터베이스 서비스

---

## 📞 문의 및 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues: [이슈 등록](https://github.com/uptomaster/walkinggrowthAPP/issues)
- 이메일: [이메일 주소]

---

<div align="center">

**걸음으로 함께 성장하는 WalkStory와 함께하세요! 🚶‍♂️🐾**

Made with ❤️ using Cursor AI

</div>
