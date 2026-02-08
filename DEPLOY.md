# 산책 성장기 배포 가이드 (Render / Vercel)

## 공통 준비

- 이 저장소를 GitHub 등에 푸시해 두세요.
- **JWT_SECRET**: 배포 시 반드시 강한 랜덤 문자열로 설정하세요.
- **Supabase DB 연동**: DB는 Supabase(PostgreSQL)를 사용합니다. 아래에서 `DATABASE_URL`을 설정하세요.

---

## Supabase 설정 (한 번만)

1. [Supabase](https://supabase.com) 로그인 후 **New Project**로 프로젝트 생성.
2. **Project Settings → Database** 이동.
3. **Connection string** 섹션에서 **URI** 선택 후, 비밀번호를 넣은 연결 문자열 복사.  
   형식 예: `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`  
   (직접 연결용: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
4. 이 값을 **DATABASE_URL** 환경 변수로 사용합니다 (로컬 `.env` 및 Render/Vercel 환경 변수).

배포 후 첫 API 호출 시 `users`, `user_data` 테이블이 자동 생성됩니다.

---

## 1. Render 배포

1. [Render](https://render.com) 로그인 후 **New → Web Service** 선택.
2. 저장소 연결 후 프로젝트 선택.
3. 설정:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Root Directory**: 비워 두기 (저장소 루트)
4. **Environment** 탭에서 변수 추가:
   - `JWT_SECRET`: 임의의 긴 비밀 문자열
   - `DATABASE_URL`: Supabase에서 복사한 PostgreSQL 연결 URI
5. **Create Web Service** 후 배포 완료될 때까지 대기.
6. 접속: `https://<서비스이름>.onrender.com/walk-growth.html`  
   - 루트 `/` 가 아닌 **/walk-growth.html** 로 접속해야 합니다.

### render.yaml 사용 시

저장소에 `render.yaml`이 있으면 **New → Blueprint**로 연결하면 동일 설정이 적용됩니다.  
환경 변수 `JWT_SECRET`, `DATABASE_URL`은 Render 대시보드에서 반드시 설정하세요.

---

## 2. Vercel 배포

1. [Vercel](https://vercel.com) 로그인 후 **Add New → Project**에서 저장소 임포트.
2. **Environment Variables**에서 추가:
   - `JWT_SECRET`: 임의의 긴 비밀 문자열
   - `DATABASE_URL`: Supabase에서 복사한 PostgreSQL 연결 URI
3. **Deploy** 실행.
4. 접속: `https://<프로젝트>.vercel.app/walk-growth.html`  
   - API는 같은 도메인의 `/api/auth/login`, `/api/user/data` 등으로 동작합니다.

### 참고 (Vercel)

- `vercel.json`에서 `/api/*` 요청이 `api/index.js`로 가도록 설정되어 있습니다.
- DB는 Supabase에 있으므로 서버리스에서도 데이터가 유지됩니다.

---

## 3. 배포 후 확인

- **로그인/회원가입**: 회원가입 후 로그인되어 보상·출석 등이 동작하는지 확인.
- **데이터 동기화**: 다른 기기나 시크릿 창에서 같은 계정으로 로그인해 데이터가 맞는지 확인.

---

## 4. 로컬에서 서버만 실행

```bash
cd server
cp env.example .env
# .env 에 JWT_SECRET, DATABASE_URL (Supabase URI) 설정
npm install
npm start
```

브라우저: `http://localhost:3000/walk-growth.html`  
(파일로 직접 열면 `file://` 이라 API가 `http://localhost:3000`으로 요청됩니다.)
