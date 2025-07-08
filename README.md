# 🎯 대학생 과팅 매칭 앱

대학교 학생들을 위한 3대3 과팅 매칭 서비스입니다.

## ✨ 주요 기능

### 현재 구현된 기능 (1-3단계)
- ✅ **회원가입/로그인 시스템**
  - JWT 기반 인증
  - 사용자 정보 관리 (대학교, 성별, 나이 등)

- ✅ **그룹 생성 및 관리**
  - 3명으로 구성된 그룹 생성
  - 그룹 리더 시스템
  - 멤버 초대 기능
  - 그룹 나가기 기능

- ✅ **시간대 설정**
  - 과팅 가능한 시간대 다중 설정
  - 날짜 및 시간 범위 지정

- ✅ **기본 매칭 시스템**
  - 시간대 교집합 기반 매칭
  - 같은 대학교, 반대 성별 그룹 매칭
  - 랜덤 매칭 알고리즘

### 향후 개발 예정 기능 (4-5단계)
- 🔄 **1대1 통화 시스템**
  - 실시간 통화 알림
  - 타이머 기반 통화 시간 제한
  - 통화 승인/거절 시스템

- 🔄 **과팅 확정 시스템**
  - 과반수 투표 시스템
  - 최종 만남 시간 조율
  - 제휴 업체 연동

## 🛠 기술 스택

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** (인증)
- **Socket.IO** (실시간 통신 - 향후 사용)
- **bcryptjs** (비밀번호 암호화)

### Frontend
- **React** + **TypeScript**
- **React Router** (라우팅)
- **Axios** (HTTP 클라이언트)
- **CSS3** (스타일링)

## 🚀 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 루트에서
npm install

# 클라이언트 의존성 설치
cd client
npm install
cd ..
```

### 2. 환경 설정

`.env` 파일이 이미 설정되어 있습니다:
```
MONGODB_URI=mongodb://localhost:27017/group-dating-app
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
```

### 3. MongoDB 설치 및 실행

MongoDB가 설치되어 있지 않다면:
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS (Homebrew)
brew install mongodb-community

# MongoDB 실행
mongod
```

### 4. 개발 서버 실행

#### 방법 1: 동시 실행 (추천)
```bash
npm run dev
```

#### 방법 2: 개별 실행
```bash
# 터미널 1 - 백엔드 서버
npm run server

# 터미널 2 - 프론트엔드 개발 서버
npm run client
```

### 5. 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 📋 사용법

### 1. 회원가입 및 로그인
1. 회원가입 페이지에서 계정 생성
2. 대학교, 성별, 나이 등 정보 입력
3. 로그인하여 대시보드 접속

### 2. 그룹 생성
1. "그룹 관리" 페이지에서 새 그룹 생성
2. 그룹 리더가 되어 다른 멤버 2명 초대
3. 총 3명이 모이면 그룹 완성

### 3. 시간대 설정
1. 그룹이 완성되면 리더가 시간대 설정 가능
2. 과팅 가능한 날짜와 시간 범위 입력
3. 여러 시간대 설정 가능

### 4. 매칭 시작
1. "과팅 찾기" 페이지에서 매칭 시작
2. 조건에 맞는 상대방 그룹과 자동 매칭
3. 매칭 성사 시 상대방 그룹 정보 확인 가능

## 🏗 프로젝트 구조

```
.
├── package.json              # 서버 의존성
├── server.js                 # Express 서버 엔트리포인트
├── .env                      # 환경 변수
├── models/                   # MongoDB 스키마
│   ├── User.js
│   └── Group.js
├── routes/                   # API 라우트
│   ├── auth.js
│   ├── groups.js
│   └── matching.js
└── client/                   # React 앱
    ├── package.json          # 클라이언트 의존성
    ├── src/
    │   ├── components/       # React 컴포넌트
    │   ├── contexts/         # React Context
    │   ├── services/         # API 서비스
    │   ├── App.tsx
    │   └── index.tsx
    └── public/
```

## 🧪 테스트 시나리오

### 기본 시나리오
1. **사용자 A, B, C** (같은 성별, 같은 대학교)가 회원가입
2. **A**가 그룹을 만들고 **B, C**를 초대
3. **A**가 과팅 가능한 시간대 설정
4. **사용자 X, Y, Z** (반대 성별, 같은 대학교)가 같은 과정 진행
5. 두 그룹 중 하나가 "과팅 찾기" 실행
6. 시간대가 겹치면 자동 매칭 성사

## 🎯 개발 우선순위

### ✅ 완료된 단계
- [x] 1단계: 회원가입/로그인 시스템
- [x] 2단계: 그룹 생성 및 관리
- [x] 3단계: 시간대 설정 및 기본 매칭

### 🔄 향후 계획
- [ ] 4단계: 1대1 통화 시스템 구현
- [ ] 5단계: 과팅 확정 및 일정 조율 시스템
- [ ] 6단계: 제휴 업체 연동 및 결제 시스템
- [ ] 7단계: 모바일 앱 개발

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새 기능 브랜치를 만듭니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 만듭니다

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🔧 트러블슈팅

### MongoDB 연결 오류
```bash
# MongoDB 서비스 상태 확인
sudo systemctl status mongod

# MongoDB 재시작
sudo systemctl restart mongod
```

### 포트 충돌
- 백엔드 포트 5000이 사용 중이라면 `.env`에서 PORT 변경
- 프론트엔드 포트 3000이 사용 중이라면 다른 포트로 자동 실행

### CORS 오류
- 서버에서 이미 CORS 설정이 되어 있습니다
- 클라이언트와 서버가 다른 도메인에서 실행되는 경우 추가 설정 필요