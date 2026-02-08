# 산책 성장기 API 서버

서버 인증(비밀번호 암호화) 및 DB 연동을 위한 Node.js API입니다.

## 기능

- **회원가입/로그인**: bcrypt로 비밀번호 해시 저장, JWT 발급
- **게임 데이터 동기화**: 로그인 사용자의 걸음·골드·인벤토리 등을 SQLite에 저장/로드

## 설치 및 실행

```bash
cd server
npm install
cp env.example .env
# .env에서 JWT_SECRET을 반드시 변경하세요.
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.  
같은 주소로 `walk-growth.html`도 제공하므로 브라우저에서 `http://localhost:3000/walk-growth.html`로 접속하면 됩니다.

## 환경 변수 (.env)

| 변수 | 설명 |
|------|------|
| `PORT` | 서버 포트 (기본 3000) |
| `JWT_SECRET` | JWT 서명용 비밀키 (배포 시 반드시 강한 랜덤 문자열로 설정) |
| `DATABASE_PATH` | SQLite DB 파일 경로 (기본 `./walk_growth.db`) |

## API

- `POST /api/auth/signup` — 회원가입 `{ "nickname", "password" }`
- `POST /api/auth/login` — 로그인 `{ "nickname", "password" }` → `{ "token", "user" }`
- `GET /api/user/me` — 현재 사용자 (Header: `Authorization: Bearer <token>`)
- `GET /api/user/data` — 게임 데이터 조회
- `POST /api/user/data` — 게임 데이터 저장 (Body: 게임 상태 JSON)

## DB 스키마 (SQLite)

- **users**: id, nickname(UNIQUE), password_hash, created_at
- **user_data**: user_id, data_json, updated_at
