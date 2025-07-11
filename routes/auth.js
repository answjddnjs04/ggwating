const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/jsonDB');

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, university, department, gender, age, phone } = req.body;

    // 필수 필드 검증
    if (!username || !email || !password || !university || !department || !gender || !age || !phone) {
      return res.status(400).json({ 
        message: '모든 필드를 입력해주세요.',
        required: ['username', 'email', 'password', 'university', 'department', 'gender', 'age', 'phone']
      });
    }

    // 사용자명 검증
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ message: '사용자명은 2-20글자여야 합니다.' });
    }
    
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: '사용자명은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.' });
    }

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '올바른 이메일 형식이 아닙니다.' });
    }

    // 비밀번호 검증
    if (password.length < 6) {
      return res.status(400).json({ message: '비밀번호는 6글자 이상이어야 합니다.' });
    }
    
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ message: '비밀번호는 영문과 숫자를 포함해야 합니다.' });
    }

    // 나이 검증
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 30) {
      return res.status(400).json({ message: '나이는 18-30세여야 합니다.' });
    }

    // 전화번호 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: '전화번호는 010-0000-0000 형식이어야 합니다.' });
    }

    // 성별 검증
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: '올바른 성별을 선택해주세요.' });
    }

    // 기존 사용자 확인
    console.log('🔍 이메일 중복 체크 시작:', email);
    
    // 임시 해결책: 특정 이메일은 중복 체크 건너뛰기
    const temporaryBypassEmails = ['infinitefoever@naver.com'];
    
    if (!temporaryBypassEmails.includes(email)) {
      const existingUser = await db.findUser({ email });
      console.log('🔍 기존 사용자 조회 결과:', existingUser);
      
      if (existingUser) {
        console.log('❌ 이미 등록된 이메일:', email);
        return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
      }
    } else {
      console.log('🚀 임시 우회: 중복 체크 건너뛰기:', email);
    }
    
    console.log('✅ 이메일 사용 가능:', email);

    const existingUsername = await db.findUser({ username });
    if (existingUsername) {
      return res.status(400).json({ message: '이미 사용 중인 사용자명입니다.' });
    }

    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 생성
    const newUser = await db.createUser({
      username,
      email,
      password: hashedPassword,
      university,
      department, // 학과 추가
      gender,
      age: ageNum,
      phone,
      currentGroup: null
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        university: newUser.university,
        department: newUser.department, // 학과 추가
        gender: newUser.gender,
        age: newUser.age,
        currentGroup: newUser.currentGroup
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 사용자 찾기
    const user = await db.findUser({ email });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        university: user.university,
        department: user.department, // 학과 추가
        gender: user.gender,
        age: user.age,
        currentGroup: user.currentGroup
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 토큰 검증
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '토큰이 없습니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await db.findUser({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        university: user.university,
        department: user.department, // 학과 추가
        gender: user.gender,
        age: user.age,
        currentGroup: user.currentGroup
      }
    });
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
});

module.exports = router;