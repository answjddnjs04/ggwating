const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/jsonDB');

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, university, gender, age, phone } = req.body;

    // 기존 사용자 확인
    const existingUser = await db.findUser({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
    }

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
      gender,
      age: parseInt(age),
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