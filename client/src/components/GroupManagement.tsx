import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { groupAPI } from '../services/api';

interface GroupInfo {
  _id: string;
  name: string;
  members: Array<{
    _id: string;
    username: string;
    email: string;
  }>;
  leader: {
    _id: string;
    username: string;
    email: string;
  };
  status: string;
  availableTimeSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

const GroupManagement: React.FC = () => {
  const { user } = useAuth();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 그룹 생성 폼
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // 멤버 초대 폼
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);

  // 시간대 설정 폼
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { date: '', startTime: '', endTime: '' }
  ]);
  const [settingTime, setSettingTime] = useState(false);

  useEffect(() => {
    fetchGroupInfo();
  }, []);

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      const response = await groupAPI.getMyGroup();
      setGroupInfo(response.data.group);
    } catch (error) {
      console.error('그룹 정보 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('그룹 이름을 입력해주세요.');
      return;
    }

    setCreatingGroup(true);
    setError('');

    try {
      await groupAPI.create({ name: groupName.trim() });
      setSuccess('그룹이 성공적으로 생성되었습니다!');
      setGroupName('');
      fetchGroupInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || '그룹 생성에 실패했습니다.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) {
      setError('초대할 사용자명을 입력해주세요.');
      return;
    }

    setInviting(true);
    setError('');

    try {
      await groupAPI.invite(inviteUsername.trim());
      setSuccess(`${inviteUsername}님을 성공적으로 초대했습니다!`);
      setInviteUsername('');
      fetchGroupInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || '멤버 초대에 실패했습니다.');
    } finally {
      setInviting(false);
    }
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][field] = value;
    setTimeSlots(newTimeSlots);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { date: '', startTime: '', endTime: '' }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const handleSetTimeSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    const validSlots = timeSlots.filter(slot => 
      slot.date && slot.startTime && slot.endTime
    );

    if (validSlots.length === 0) {
      setError('최소 하나의 완전한 시간대를 입력해주세요.');
      return;
    }

    // 시간 유효성 검사
    for (const slot of validSlots) {
      if (slot.startTime >= slot.endTime) {
        setError('시작 시간은 종료 시간보다 빨라야 합니다.');
        return;
      }
    }

    setSettingTime(true);
    setError('');

    try {
      await groupAPI.setTimeSlots(validSlots);
      setSuccess('시간대가 성공적으로 설정되었습니다!');
      fetchGroupInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || '시간대 설정에 실패했습니다.');
    } finally {
      setSettingTime(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('정말로 그룹에서 나가시겠습니까?')) {
      return;
    }

    try {
      await groupAPI.leave();
      setSuccess('그룹에서 나왔습니다.');
      setGroupInfo(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '그룹 나가기에 실패했습니다.');
    }
  };

  const isGroupLeader = () => {
    return groupInfo && user && groupInfo.leader._id === user.id;
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <h2>그룹 관리</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!groupInfo ? (
        // 그룹이 없을 때 - 그룹 생성 폼
        <div className="card">
          <h3>새 그룹 만들기</h3>
          <form onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label htmlFor="groupName">그룹 이름</label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="그룹 이름을 입력하세요"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={creatingGroup}
            >
              {creatingGroup ? '생성 중...' : '그룹 만들기'}
            </button>
          </form>
        </div>
      ) : (
        // 그룹이 있을 때
        <div>
          {/* 그룹 정보 */}
          <div className="card">
            <h3>그룹 정보</h3>
            <p><strong>그룹명:</strong> {groupInfo.name}</p>
            <p><strong>상태:</strong> {groupInfo.status}</p>
            <p><strong>리더:</strong> {groupInfo.leader.username}</p>
            
            <h4>멤버 ({(groupInfo.members || []).length}/3명)</h4>
            <div className="group-members">
              {(groupInfo.members || []).map((member) => (
                <div key={member._id} className="member-item">
                  <span>{member.username}</span>
                  {member._id === groupInfo.leader?._id && (
                    <span className="member-role">리더</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={handleLeaveGroup}
                className="btn btn-danger"
              >
                그룹 나가기
              </button>
            </div>
          </div>

          {/* 멤버 초대 (리더만) */}
          {isGroupLeader() && (groupInfo.members || []).length < 3 && (
            <div className="card">
              <h3>멤버 초대</h3>
              <form onSubmit={handleInviteMember}>
                <div className="form-group">
                  <label htmlFor="inviteUsername">초대할 사용자명</label>
                  <input
                    type="text"
                    id="inviteUsername"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="사용자명을 입력하세요"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={inviting}
                >
                  {inviting ? '초대 중...' : '초대하기'}
                </button>
              </form>
            </div>
          )}

          {/* 시간대 설정 (리더만, 멤버가 3명일 때) */}
          {isGroupLeader() && (groupInfo.members || []).length === 3 && (
            <div className="card">
              <h3>과팅 가능 시간대 설정</h3>
              
              {(groupInfo.availableTimeSlots || []).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4>현재 설정된 시간대:</h4>
                  <div className="time-slots">
                    {(groupInfo.availableTimeSlots || []).map((slot, index) => (
                      <div key={index} className="time-slot">
                        <span>
                          {new Date(slot.date).toLocaleDateString()} 
                          {' '}{slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSetTimeSlots}>
                {timeSlots.map((slot, index) => (
                  <div key={index} className="time-slot">
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => handleTimeSlotChange(index, 'date', e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                      required
                    />
                    {timeSlots.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem' }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    onClick={addTimeSlot}
                    className="btn btn-secondary"
                  >
                    시간대 추가
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={settingTime}
                  >
                    {settingTime ? '설정 중...' : '시간대 설정'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupManagement;