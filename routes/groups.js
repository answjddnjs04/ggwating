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

// 그룹 생성
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    // 사용자가 이미 그룹에 속해있는지 확인
    if (req.user.currentGroup) {
      return res.status(400).json({ message: '이미 그룹에 속해있습니다.' });
    }

    // 그룹 생성
    const newGroup = await db.createGroup({
      name,
      leader: req.user._id,
      members: [req.user._id],
      gender: req.user.gender,
      university: req.user.university,
      timeSlots: [],
      status: 'forming',
      currentMatch: null
    });

    // 사용자의 currentGroup 업데이트
    await db.updateUser(req.user._id, { currentGroup: newGroup._id });

    res.status(201).json({
      message: '그룹이 생성되었습니다.',
      group: newGroup
    });
  } catch (error) {
    console.error('그룹 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 그룹에 멤버 초대
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;

    // 현재 사용자의 그룹 확인
    const userGroup = await db.findGroup({ _id: req.user.currentGroup });
    if (!userGroup) {
      return res.status(400).json({ message: '그룹에 속해있지 않습니다.' });
    }

    // 그룹장인지 확인
    if (userGroup.leader !== req.user._id) {
      return res.status(403).json({ message: '그룹장만 멤버를 초대할 수 있습니다.' });
    }

    // 그룹이 가득 찼는지 확인
    if (userGroup.members.length >= 3) {
      return res.status(400).json({ message: '그룹이 가득 찼습니다.' });
    }

    // 초대할 사용자 찾기
    const inviteUser = await db.findUser({ username });
    if (!inviteUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 초대할 사용자가 이미 그룹에 속해있는지 확인
    if (inviteUser.currentGroup) {
      return res.status(400).json({ message: '해당 사용자는 이미 다른 그룹에 속해있습니다.' });
    }

    // 같은 성별과 대학교인지 확인
    if (inviteUser.gender !== userGroup.gender || inviteUser.university !== userGroup.university) {
      return res.status(400).json({ message: '같은 성별과 대학교 학생만 초대할 수 있습니다.' });
    }

    // 그룹에 멤버 추가
    const updatedMembers = [...userGroup.members, inviteUser._id];
    await db.updateGroup(userGroup._id, { 
      members: updatedMembers,
      status: updatedMembers.length === 3 ? 'ready' : 'forming'
    });

    // 사용자의 currentGroup 업데이트
    await db.updateUser(inviteUser._id, { currentGroup: userGroup._id });

    res.json({
      message: `${inviteUser.username}님이 그룹에 초대되었습니다.`,
      membersCount: updatedMembers.length
    });
  } catch (error) {
    console.error('멤버 초대 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 그룹 탈퇴
router.post('/leave', authenticateToken, async (req, res) => {
  try {
    const userGroup = await db.findGroup({ _id: req.user.currentGroup });
    if (!userGroup) {
      return res.status(400).json({ message: '그룹에 속해있지 않습니다.' });
    }

    // 그룹에서 멤버 제거
    const updatedMembers = userGroup.members.filter(memberId => memberId !== req.user._id);
    
    if (updatedMembers.length === 0) {
      // 마지막 멤버가 나가면 그룹 삭제는 여기서는 생략 (JSON에서 삭제 로직 복잡)
      await db.updateGroup(userGroup._id, { 
        members: [],
        status: 'disbanded'
      });
    } else {
      // 그룹장이 나가는 경우 새로운 그룹장 지정
      let newLeader = userGroup.leader;
      if (userGroup.leader === req.user._id) {
        newLeader = updatedMembers[0];
      }

      await db.updateGroup(userGroup._id, { 
        members: updatedMembers,
        leader: newLeader,
        status: updatedMembers.length === 3 ? 'ready' : 'forming'
      });
    }

    // 사용자의 currentGroup 해제
    await db.updateUser(req.user._id, { currentGroup: null });

    res.json({ message: '그룹에서 탈퇴했습니다.' });
  } catch (error) {
    console.error('그룹 탈퇴 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 시간대 설정
router.post('/timeslots', authenticateToken, async (req, res) => {
  try {
    const { timeSlots } = req.body;

    const userGroup = await db.findGroup({ _id: req.user.currentGroup });
    if (!userGroup) {
      return res.status(400).json({ message: '그룹에 속해있지 않습니다.' });
    }

    // 그룹장인지 확인
    if (userGroup.leader !== req.user._id) {
      return res.status(403).json({ message: '그룹장만 시간대를 설정할 수 있습니다.' });
    }

    // 시간대 업데이트
    await db.updateGroup(userGroup._id, { timeSlots });

    res.json({ message: '시간대가 설정되었습니다.' });
  } catch (error) {
    console.error('시간대 설정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 그룹 정보 조회
router.get('/my-group', authenticateToken, async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.json({ group: null });
    }

    const group = await db.findGroup({ _id: req.user.currentGroup });
    if (!group) {
      return res.json({ group: null });
    }

    // 멤버 정보 가져오기 (간단한 정보만)
    const memberDetails = [];
    for (const memberId of group.members) {
      const member = await db.findUser({ _id: memberId });
      if (member) {
        memberDetails.push({
          id: member._id,
          username: member.username,
          age: member.age
        });
      }
    }

    res.json({
      group: {
        ...group,
        memberDetails
      }
    });
  } catch (error) {
    console.error('그룹 정보 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;