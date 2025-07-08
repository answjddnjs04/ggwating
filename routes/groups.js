const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken } = require('./auth');
const router = express.Router();

// 그룹 생성
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;

    // 입력 검증
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: '그룹 이름을 입력해주세요.' });
    }

    // 이미 그룹에 속해있는지 확인
    if (req.user.currentGroup) {
      return res.status(400).json({ message: '이미 그룹에 속해있습니다.' });
    }

    // 새 그룹 생성
    const group = new Group({
      name: name.trim(),
      leader: userId,
      members: [userId],
      gender: req.user.gender,
      university: req.user.university,
      status: 'forming'
    });

    await group.save();

    // 사용자의 currentGroup 업데이트
    await User.findByIdAndUpdate(userId, { currentGroup: group._id });

    // 생성된 그룹 정보를 populate해서 반환
    const populatedGroup = await Group.findById(group._id)
      .populate('leader', 'username email')
      .populate('members', 'username email');

    res.status(201).json({
      message: '그룹이 생성되었습니다.',
      group: populatedGroup
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
    const userId = req.user._id;

    // 입력 검증
    if (!username) {
      return res.status(400).json({ message: '초대할 사용자명을 입력해주세요.' });
    }

    // 현재 사용자가 그룹 리더인지 확인
    const group = await Group.findOne({ leader: userId }).populate('members', 'username email');
    if (!group) {
      return res.status(404).json({ message: '관리 권한이 있는 그룹을 찾을 수 없습니다.' });
    }

    // 그룹이 이미 가득 찼는지 확인
    if (group.isFull()) {
      return res.status(400).json({ message: '그룹이 이미 가득 찼습니다.' });
    }

    // 초대할 사용자 찾기
    const invitedUser = await User.findOne({ username });
    if (!invitedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 이미 그룹에 속해있는지 확인
    if (invitedUser.currentGroup) {
      return res.status(400).json({ message: '해당 사용자는 이미 다른 그룹에 속해있습니다.' });
    }

    // 같은 성별인지 확인
    if (invitedUser.gender !== group.gender) {
      return res.status(400).json({ message: '같은 성별의 사용자만 초대할 수 있습니다.' });
    }

    // 같은 대학교인지 확인
    if (invitedUser.university !== group.university) {
      return res.status(400).json({ message: '같은 대학교 사용자만 초대할 수 있습니다.' });
    }

    // 이미 그룹 멤버인지 확인
    if (group.members.some(member => member._id.toString() === invitedUser._id.toString())) {
      return res.status(400).json({ message: '이미 그룹 멤버입니다.' });
    }

    // 그룹에 멤버 추가
    group.members.push(invitedUser._id);
    if (group.isFull()) {
      group.status = 'ready';
    }
    await group.save();

    // 사용자의 currentGroup 업데이트
    await User.findByIdAndUpdate(invitedUser._id, { currentGroup: group._id });

    // 업데이트된 그룹 정보 반환
    const updatedGroup = await Group.findById(group._id)
      .populate('leader', 'username email')
      .populate('members', 'username email');

    res.json({
      message: `${invitedUser.username}님이 그룹에 추가되었습니다.`,
      group: updatedGroup
    });
  } catch (error) {
    console.error('그룹 초대 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 내 그룹 정보 조회
router.get('/my-group', authenticateToken, async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.json({ group: null });
    }

    const group = await Group.findById(req.user.currentGroup)
      .populate('leader', 'username email')
      .populate('members', 'username email')
      .populate('currentMatch', 'name university');

    if (!group) {
      return res.json({ group: null });
    }

    res.json({ group });
  } catch (error) {
    console.error('그룹 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 그룹에서 나가기
router.post('/leave', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.user.currentGroup) {
      return res.status(400).json({ message: '속해있는 그룹이 없습니다.' });
    }

    const group = await Group.findById(req.user.currentGroup);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }

    // 리더가 나가는 경우
    if (group.leader.toString() === userId.toString()) {
      // 다른 멤버가 있으면 첫 번째 멤버를 새 리더로 지정
      const otherMembers = group.members.filter(member => member.toString() !== userId.toString());
      
      if (otherMembers.length > 0) {
        group.leader = otherMembers[0];
        group.members = otherMembers;
      } else {
        // 혼자였다면 그룹 삭제
        await Group.findByIdAndDelete(group._id);
        await User.findByIdAndUpdate(userId, { currentGroup: null });
        return res.json({ message: '그룹에서 나왔습니다.' });
      }
    } else {
      // 일반 멤버가 나가는 경우
      group.members = group.members.filter(member => member.toString() !== userId.toString());
    }

    // 그룹 상태 업데이트
    if (group.members.length < 3) {
      group.status = 'forming';
      group.isLookingForMatch = false;
    }

    await group.save();

    // 사용자의 currentGroup 제거
    await User.findByIdAndUpdate(userId, { currentGroup: null });

    res.json({ message: '그룹에서 나왔습니다.' });
  } catch (error) {
    console.error('그룹 나가기 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 시간대 추가/수정
router.post('/time-slots', authenticateToken, async (req, res) => {
  try {
    const { timeSlots } = req.body;
    const userId = req.user._id;

    // 입력 검증
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ message: '유효한 시간대를 입력해주세요.' });
    }

    // 그룹 리더인지 확인
    const group = await Group.findOne({ leader: userId });
    if (!group) {
      return res.status(404).json({ message: '관리 권한이 있는 그룹을 찾을 수 없습니다.' });
    }

    // 그룹이 가득 찼는지 확인
    if (!group.isFull()) {
      return res.status(400).json({ message: '그룹 멤버가 모두 모인 후에 시간대를 설정할 수 있습니다.' });
    }

    // 시간대 형식 검증
    for (const slot of timeSlots) {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        return res.status(400).json({ message: '모든 시간대 정보를 입력해주세요.' });
      }
    }

    // 시간대 업데이트
    group.availableTimeSlots = timeSlots;
    group.status = 'ready';
    await group.save();

    res.json({
      message: '시간대가 설정되었습니다.',
      group: await Group.findById(group._id)
        .populate('leader', 'username email')
        .populate('members', 'username email')
    });
  } catch (error) {
    console.error('시간대 설정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;