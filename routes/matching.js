const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken } = require('./auth');
const router = express.Router();

// 시간대 겹침 확인 함수
const checkTimeOverlap = (timeSlot1, timeSlot2) => {
  const date1 = new Date(timeSlot1.date).toDateString();
  const date2 = new Date(timeSlot2.date).toDateString();
  
  // 같은 날짜인지 확인
  if (date1 !== date2) {
    return false;
  }
  
  // 시간 문자열을 분으로 변환
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const start1 = timeToMinutes(timeSlot1.startTime);
  const end1 = timeToMinutes(timeSlot1.endTime);
  const start2 = timeToMinutes(timeSlot2.startTime);
  const end2 = timeToMinutes(timeSlot2.endTime);
  
  // 겹치는 시간이 있는지 확인
  return start1 < end2 && start2 < end1;
};

// 두 그룹의 시간대 교집합 찾기
const findTimeIntersection = (group1TimeSlots, group2TimeSlots) => {
  for (const slot1 of group1TimeSlots) {
    for (const slot2 of group2TimeSlots) {
      if (checkTimeOverlap(slot1, slot2)) {
        return true;
      }
    }
  }
  return false;
};

// 과팅 찾기 (매칭 시작)
router.post('/find-match', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // 사용자가 그룹 리더인지 확인
    const myGroup = await Group.findOne({ leader: userId })
      .populate('members', 'username email');
    
    if (!myGroup) {
      return res.status(404).json({ message: '관리 권한이 있는 그룹을 찾을 수 없습니다.' });
    }

    // 그룹이 매칭 준비가 되었는지 확인
    if (!myGroup.isReadyForMatching()) {
      return res.status(400).json({ 
        message: '그룹 멤버가 3명이고 시간대가 설정되어야 매칭을 시작할 수 있습니다.' 
      });
    }

    // 이미 매칭 중이거나 매칭된 상태인지 확인
    if (myGroup.status === 'matching' || myGroup.status === 'matched') {
      return res.status(400).json({ message: '이미 매칭 진행 중이거나 매칭된 상태입니다.' });
    }

    // 매칭 대상 그룹 찾기 (반대 성별, 같은 대학교, 시간대 겹침)
    const targetGender = myGroup.gender === 'male' ? 'female' : 'male';
    
    const candidateGroups = await Group.find({
      _id: { $ne: myGroup._id }, // 자신의 그룹 제외
      gender: targetGender,
      university: myGroup.university,
      status: 'ready',
      isLookingForMatch: false // 아직 매칭을 찾지 않은 그룹
    }).populate('members', 'username email');

    // 시간대가 겹치는 그룹 찾기
    const matchingGroups = candidateGroups.filter(group => 
      findTimeIntersection(myGroup.availableTimeSlots, group.availableTimeSlots)
    );

    if (matchingGroups.length === 0) {
      return res.json({ 
        message: '현재 매칭 가능한 그룹이 없습니다. 나중에 다시 시도해주세요.',
        matchFound: false 
      });
    }

    // 랜덤하게 하나의 그룹 선택
    const randomIndex = Math.floor(Math.random() * matchingGroups.length);
    const matchedGroup = matchingGroups[randomIndex];

    // 두 그룹 모두 매칭 상태로 업데이트
    await Group.findByIdAndUpdate(myGroup._id, {
      status: 'matched',
      currentMatch: matchedGroup._id,
      isLookingForMatch: true
    });

    await Group.findByIdAndUpdate(matchedGroup._id, {
      status: 'matched',
      currentMatch: myGroup._id,
      isLookingForMatch: true
    });

    // 매칭된 그룹 정보 반환
    const updatedMyGroup = await Group.findById(myGroup._id)
      .populate('members', 'username email')
      .populate('currentMatch', 'name members');

    res.json({
      message: '매칭이 성사되었습니다!',
      matchFound: true,
      myGroup: updatedMyGroup,
      matchedGroup: await Group.findById(matchedGroup._id)
        .populate('members', 'username email')
    });

  } catch (error) {
    console.error('매칭 찾기 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 매칭 상태 확인
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.json({ 
        hasGroup: false,
        message: '먼저 그룹을 만들어주세요.' 
      });
    }

    const group = await Group.findById(req.user.currentGroup)
      .populate('members', 'username email')
      .populate('currentMatch', 'name members university');

    if (!group) {
      return res.json({ 
        hasGroup: false,
        message: '그룹을 찾을 수 없습니다.' 
      });
    }

    let statusMessage = '';
    switch (group.status) {
      case 'forming':
        statusMessage = `그룹 멤버 모집 중 (${group.members.length}/3명)`;
        break;
      case 'ready':
        statusMessage = '매칭 준비 완료';
        break;
      case 'matching':
        statusMessage = '매칭 진행 중...';
        break;
      case 'matched':
        statusMessage = '매칭 성사! 통화 대기 중';
        break;
      case 'completed':
        statusMessage = '과팅 확정됨';
        break;
    }

    res.json({
      hasGroup: true,
      group,
      statusMessage,
      canStartMatching: group.isReadyForMatching() && group.status === 'ready'
    });

  } catch (error) {
    console.error('매칭 상태 확인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 매칭 취소
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const group = await Group.findOne({ leader: userId });
    if (!group) {
      return res.status(404).json({ message: '관리 권한이 있는 그룹을 찾을 수 없습니다.' });
    }

    if (group.status !== 'matched') {
      return res.status(400).json({ message: '취소할 매칭이 없습니다.' });
    }

    // 상대방 그룹도 매칭 취소
    if (group.currentMatch) {
      await Group.findByIdAndUpdate(group.currentMatch, {
        status: 'ready',
        currentMatch: null,
        isLookingForMatch: false
      });
    }

    // 내 그룹 매칭 취소
    await Group.findByIdAndUpdate(group._id, {
      status: 'ready',
      currentMatch: null,
      isLookingForMatch: false
    });

    res.json({ message: '매칭이 취소되었습니다.' });

  } catch (error) {
    console.error('매칭 취소 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용 가능한 매칭 그룹 목록 조회 (테스트용)
router.get('/available-groups', authenticateToken, async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.status(400).json({ message: '먼저 그룹을 만들어주세요.' });
    }

    const myGroup = await Group.findById(req.user.currentGroup);
    if (!myGroup) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    const targetGender = myGroup.gender === 'male' ? 'female' : 'male';
    
    const availableGroups = await Group.find({
      _id: { $ne: myGroup._id },
      gender: targetGender,
      university: myGroup.university,
      status: 'ready',
      isLookingForMatch: false
    })
    .populate('members', 'username')
    .select('name members university availableTimeSlots');

    // 시간대 겹치는 그룹만 필터링
    const matchingGroups = availableGroups.filter(group => 
      findTimeIntersection(myGroup.availableTimeSlots, group.availableTimeSlots)
    );

    res.json({
      availableGroups: matchingGroups,
      count: matchingGroups.length
    });

  } catch (error) {
    console.error('사용 가능한 그룹 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;