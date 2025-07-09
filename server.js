const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path'); // path 모듈 추가

// MongoDB 대신 JSON 데이터베이스 사용
const db = require('./database/jsonDB');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (빌드된 React 앱)
app.use(express.static('client/build'));

// API 라우트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/matching', require('./routes/matching'));

// React 앱 서빙 (모든 다른 라우트에 대해)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);

  socket.on('join-group', (groupId) => {
    socket.join(groupId);
    console.log(`사용자 ${socket.id}가 그룹 ${groupId}에 참여`);
  });

  socket.on('group-update', (data) => {
    socket.to(data.groupId).emit('group-updated', data);
  });

  socket.on('match-found', (data) => {
    io.emit('new-match', data);
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 해제됨:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// 서버 시작
async function startServer() {
  try {
    // JSON 데이터베이스 연결 (파일 생성)
    await db.connect();
    
    server.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다!`);
      console.log(`📁 JSON 데이터베이스를 사용합니다.`);
      console.log(`🌐 http://localhost:${PORT} 에서 앱을 확인하세요!`);
    });
  } catch (error) {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
}

startServer();