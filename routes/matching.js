const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/jsonDB');

const router = express.Router();

// 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
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

    req.user = user;
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 시간대 겹치는지 확인하는 함수
function hasTimeOverlap(slots1, slots2) {
  if (!slots1 || !slots2 || slots1.length === 0 || slots2.length === 0) {
    return false;
  }

  for (const slot1 of slots1) {
    for (const slot2 of slots2) {
      if (slot1.date === slot2.date) {
        const start1 = new Date(`${slot1.date} ${slot1.startTime}`);
        const end1 = new Date(`${slot1.date} ${slot1.endTime}`);
        const start2 = new Date(`${slot2.date} ${slot2.startTime}`);
        const end2 = new Date(`${slot2.date} ${slot2.endTime}`);

        // 시간 겹침 확인
        if (start1 < end2 && start2 < end1) {
          return true;
        }
      }
    }
  }
  return false;
}

// 매칭 시작
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const userGroup = await db.findGroup({ _id: req.user.currentGroup });
    if (!userGroup) {
      return res.status(400).json({ message: '그룹에 속해있지 않습니다.' });
    }

    // 그룹장인지 확인
    if (userGroup.leader !== req.user._id) {
      return res.status(403).json({ message: '그룹장만 매칭을 시작할 수 있습니다.' });
    }

    // 그룹이 준비 상태인지 확인
    if (userGroup.status !== 'ready' || userGroup.members.length !== 3) {
      return res.status(400).json({ message: '그룹이 완성되지 않았습니다.' });
    }

    // 시간대가 설정되었는지 확인
    if (!userGroup.timeSlots || userGroup.timeSlots.length === 0) {
      return res.status(400).json({ message: '시간대를 먼저 설정해주세요.' });
    }

    // 반대 성별 그룹 찾기
    const oppositeGender = userGroup.gender === 'male' ? 'female' : 'male';
    const candidateGroups = await db.findGroups({
      university: userGroup.university,
      gender: oppositeGender,
      status: 'ready'
    });

    // 시간대가 겹치는 그룹 찾기
    const compatibleGroups = candidateGroups.filter(group => 
      group._id !== userGroup._id && 
      !group.currentMatch &&
      hasTimeOverlap(userGroup.timeSlots, group.timeSlots)
    );

    if (compatibleGroups.length === 0) {
      return res.status(404).json({ message: '매칭 가능한 그룹을 찾을 수 없습니다.' });
    }

    // 랜덤하게 하나 선택
    const randomIndex = Math.floor(Math.random() * compatibleGroups.length);
    const matchedGroup = compatibleGroups[randomIndex];

    // 양쪽 그룹 매칭 상태 업데이트
    await db.updateGroup(userGroup._id, {
      status: 'matched',
      currentMatch: matchedGroup._id
    });

    await db.updateGroup(matchedGroup._id, {
      status: 'matched',
      currentMatch: userGroup._id
    });

    res.json({
      message: '매칭이 성공했습니다!',
      matchedGroup: {
        id: matchedGroup._id,
        name: matchedGroup.name,
        university: matchedGroup.university,
        gender: matchedGroup.gender
      }
    });
  } catch (error) {
    console.error('매칭 시작 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 매칭 상태 확인
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.json({ status: 'no_group' });
    }

    const userGroup = await db.findGroup({ _id: req.user.currentGroup });
    if (!userGroup) {
      return res.json({ status: 'no_group' });
    }

    if (userGroup.status === 'matched' && userGroup.currentMatch) {
      const matchedGroup = await db.findGroup({ _id: userGroup.currentMatch });
      
      return res.json({
        status: 'matched',
        matchedGroup: matchedGroup ? {
          id: matchedGroup._id,
          name: matchedGroup.name,
          university: matchedGroup.university,
          gender: matchedGroup.gender
        } : null
      });
    }

    res.json({
      status: userGroup.status || 'forming'
    });
  } catch (error) {
    console.error('매칭 상태 확인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 매칭 취소
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userGroup = await db.findGroup({ _id: req.user.currentGroup });
    if (!userGroup) {
      return res.status(400).json({ message: '그룹에 속해있지 않습니다.' });
    }

    // 그룹장인지 확인
    if (userGroup.leader !== req.user._id) {
      return res.status(403).json({ message: '그룹장만 매칭을 취소할 수 있습니다.' });
    }

    if (userGroup.status !== 'matched') {
      return res.status(400).json({ message: '매칭 상태가 아닙니다.' });
    }

    // 상대 그룹도 매칭 해제
    if (userGroup.currentMatch) {
      await db.updateGroup(userGroup.currentMatch, {
        status: 'ready',
        currentMatch: null
      });
    }

    // 내 그룹 매칭 해제
    await db.updateGroup(userGroup._id, {
      status: 'ready',
      currentMatch: null
    });

    res.json({ message: '매칭이 취소되었습니다.' });
  } catch (error) {
    console.error('매칭 취소 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;