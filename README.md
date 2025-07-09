# � 대학교 과팅 앱 (GGwating)

> **University Group Dating App** - 3명씩 그룹을 이뤄 시간대를 맞춰 과팅을 매칭해주는 웹 애플리케이션

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue)](https://answjddnjs04.github.io/ggwating)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue)](https://reactjs.org/)

## 🌐 **라이브 데모**
**👉 [https://answjddnjs04.github.io/ggwating](https://answjddnjs04.github.io/ggwating)**

---

## ✨ **주요 기능**

### 👥 **그룹 매칭 시스템**
- 🎯 **3명 단위 그룹** 생성 및 관리
- 👨‍🎓 **같은 대학교** 학생들끼리 매칭
- ⚡ **시간대 기반** 자동 매칭 알고리즘
- 🔄 **실시간** 매칭 상태 업데이트

### 🔐 **사용자 시스템**
- 📧 **JWT 인증** 기반 회원가입/로그인
- 🏫 **대학교 검증** 및 프로필 관리
- 👑 **그룹장 시스템** (초대, 시간 설정 권한)
- � **완전 반응형** 모바일 최적화

### ⏰ **스마트 스케줄링**
- 📅 **다중 시간대** 설정 가능
- 🎯 **겹치는 시간** 자동 감지
- 💌 **즉시 매칭** 알림 시스템

---

## � **기술 스택**

### **Frontend**
- ⚛️ **React 18** (TypeScript)
- 🎨 **CSS3** (모던 디자인)
- 🌐 **Axios** (API 통신)
- � **반응형 디자인**

### **Backend**
- 🟢 **Node.js** + **Express.js**
- 🔐 **JWT** 인증
- 📁 **JSON 파일 데이터베이스** (설치 불필요!)
- 🔄 **Socket.IO** (실시간 통신)

### **배포**
- 🌐 **GitHub Pages** (프론트엔드)
- 📦 **GitHub Actions** (자동 배포)

---

## 🚀 **빠른 시작**

### **📋 시스템 요구사항**
- Node.js 16+ 
- npm 또는 yarn

### **⚡ 1분 설치**

```bash
# 1. 저장소 클론
git clone https://github.com/answjddnjs04/ggwating.git
cd ggwating

# 2. 의존성 설치
npm install

# 3. 서버 실행 (JSON DB 자동 생성!)
npm start

# 4. 프론트엔드 실행 (새 터미널)
cd client
npm install
npm start
```

### **🎯 접속**
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Production Build**: http://localhost:5000 (통합 서빙)

---

## � **사용 방법**

### **1️⃣ 회원가입**
```
✅ 이메일, 사용자명, 비밀번호
✅ 대학교, 성별, 나이 (18-30세)
✅ 연락처 정보
```

### **2️⃣ 그룹 생성**
```
👑 그룹장이 되어 그룹 생성
👥 같은 성별/대학교 친구 2명 초대
📝 그룹명 설정
```

### **3️⃣ 시간대 설정**
```
📅 가능한 날짜/시간 입력
⏰ 여러 시간대 설정 가능
🎯 매칭 준비 완료
```

### **4️⃣ 자동 매칭**
```
🔍 조건 맞는 상대 그룹 검색
⚡ 시간대 겹치는 그룹 자동 매칭
💕 매칭 성공 시 알림
```

---

## 📂 **프로젝트 구조**

```
ggwating/
├── 🖥️ server.js                 # Express 서버
├── 🗂️ database/
│   ├── jsonDB.js               # JSON 데이터베이스 엔진
│   └── data/                   # 자동 생성되는 데이터 폴더
│       ├── users.json          # 사용자 데이터
│       └── groups.json         # 그룹 데이터
├── 🛣️ routes/
│   ├── auth.js                 # 인증 API
│   ├── groups.js               # 그룹 관리 API
│   └── matching.js             # 매칭 API
├── 🎨 client/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   ├── services/          # API 서비스
│   │   ├── context/           # 인증 컨텍스트
│   │   └── styles/            # CSS 스타일
│   └── build/                 # 빌드된 정적 파일
└── 📦 package.json
```

---

## 🔧 **개발 스크립트**

```bash
# 🔥 개발 서버 (자동 재시작)
npm run dev

# 🚀 프로덕션 서버
npm start

# 🎨 프론트엔드만 개발
cd client && npm start

# 📦 프로덕션 빌드
cd client && npm run build

# 🌐 GitHub Pages 배포
cd client && npm run deploy
```

---

## 📊 **데이터베이스**

### **📁 JSON 파일 기반 (설치 불필요!)**
- **위치**: `database/data/`
- **자동 생성**: 첫 실행 시 자동으로 생성
- **백업 쉬움**: 단순 JSON 파일로 백업/복원 가능

### **📋 데이터 구조**

#### **사용자 (users.json)**
```json
{
  "_id": "고유ID",
  "username": "사용자명",
  "email": "이메일",
  "password": "해시된 비밀번호",
  "university": "대학교명",
  "gender": "male|female",
  "age": 21,
  "phone": "연락처",
  "currentGroup": "그룹ID|null"
}
```

#### **그룹 (groups.json)**
```json
{
  "_id": "고유ID",
  "name": "그룹명",
  "leader": "그룹장ID",
  "members": ["멤버1", "멤버2", "멤버3"],
  "gender": "male|female",
  "university": "대학교명",
  "timeSlots": [
    {
      "date": "2024-01-15",
      "startTime": "18:00",
      "endTime": "22:00"
    }
  ],
  "status": "forming|ready|matched",
  "currentMatch": "매칭된그룹ID|null"
}
```

---

## 🔗 **API 엔드포인트**

### **🔐 인증 (`/api/auth`)**
```
POST /register    # 회원가입
POST /login       # 로그인  
GET  /verify      # 토큰 검증
```

### **👥 그룹 (`/api/groups`)**
```
POST /create      # 그룹 생성
POST /invite      # 멤버 초대
POST /leave       # 그룹 탈퇴
POST /timeslots   # 시간대 설정
GET  /my-group    # 내 그룹 정보
```

### **💕 매칭 (`/api/matching`)**
```
POST /start       # 매칭 시작
GET  /status      # 매칭 상태 확인
POST /cancel      # 매칭 취소
```

---

## 🎨 **디자인 시스템**

### **🌸 컬러 팔레트**
```css
Primary Pink:   #ff69b4, #ff1493
Secondary:      #ffc0cb, #ffb6c1  
Accent:         #fff0f5, #ffe4e1
Text:           #333, #666
Background:     #ffffff, #fafafa
```

### **📱 반응형 브레이크포인트**
```css
Mobile:    < 768px
Tablet:    768px - 1024px  
Desktop:   > 1024px
```

---

## 🔄 **향후 개발 계획**

### **🎯 Phase 1 (현재 완료)**
- ✅ 기본 인증 시스템
- ✅ 그룹 생성/관리
- ✅ 시간대 기반 매칭
- ✅ 반응형 UI/UX

### **� Phase 2 (계획중)**
- 📞 화상/음성 통화 시스템
- 📱 1:1 확정 투표 기능
- 🏪 제휴 업체 연동
- 📍 위치 기반 추천

### **💡 Phase 3 (미래)**
- 📊 매칭 성공률 분석
- 🤖 AI 기반 취향 매칭
- 🎮 게임/이벤트 기능
- 💌 후기/평점 시스템

---

## 🤝 **기여하기**

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

---

## 📝 **라이선스**

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📞 **연락처**

프로젝트 관련 문의나 버그 리포트는 GitHub Issues를 이용해주세요.

**🌟 Star를 눌러주시면 개발에 큰 도움이 됩니다!**

---

## 🎉 **특별 감사**

- 💖 **React** 팀의 훌륭한 프레임워크
- 🟢 **Node.js** 커뮤니티
- 🎨 **CSS Grid & Flexbox** 기술
- 🌐 **GitHub Pages** 무료 호스팅

---

**💕 Happy Dating! 즐거운 과팅 되세요! 💕**