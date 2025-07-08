import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { groupAPI, matchingAPI } from '../services/api';

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
  currentMatch?: {
    _id: string;
    name: string;
    university: string;
  };
}

interface MatchingStatus {
  hasGroup: boolean;
  group?: GroupInfo;
  statusMessage: string;
  canStartMatching: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 그룹 정보와 매칭 상태를 동시에 가져오기
      const [groupResponse, statusResponse] = await Promise.all([
        groupAPI.getMyGroup(),
        matchingAPI.getStatus()
      ]);

      setGroupInfo(groupResponse.data.group);
      setMatchingStatus(statusResponse.data);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming': return '#6c757d';
      case 'ready': return '#28a745';
      case 'matching': return '#ffc107';
      case 'matched': return '#e91e63';
      case 'completed': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'forming': return '멤버 모집 중';
      case 'ready': return '매칭 준비 완료';
      case 'matching': return '매칭 진행 중';
      case 'matched': return '매칭 성사됨';
      case 'completed': return '과팅 완료';
      default: return '알 수 없음';
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <h2>대시보드</h2>
      
      {/* 사용자 정보 카드 */}
      <div className="card">
        <h3>내 정보</h3>
        <p><strong>사용자명:</strong> {user?.username}</p>
        <p><strong>대학교:</strong> {user?.university}</p>
        <p><strong>성별:</strong> {user?.gender === 'male' ? '남성' : '여성'}</p>
        <p><strong>나이:</strong> {user?.age}세</p>
      </div>

      {/* 그룹 정보 카드 */}
      <div className="card">
        <h3>내 그룹 정보</h3>
        {groupInfo ? (
          <div>
            <p><strong>그룹명:</strong> {groupInfo.name}</p>
            <p>
              <strong>상태:</strong> 
              <span style={{ 
                color: getStatusColor(groupInfo.status),
                fontWeight: 'bold',
                marginLeft: '0.5rem'
              }}>
                {getStatusText(groupInfo.status)}
              </span>
            </p>
            <div>
              <strong>멤버 ({groupInfo.members.length}/3명):</strong>
              <div className="group-members">
                {groupInfo.members.map((member) => (
                  <div key={member._id} className="member-item">
                    <span>{member.username}</span>
                    {member._id === groupInfo.leader._id && (
                      <span className="member-role">리더</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {groupInfo.availableTimeSlots.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>설정된 시간대:</strong>
                <div className="time-slots">
                  {groupInfo.availableTimeSlots.map((slot, index) => (
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

            {groupInfo.currentMatch && (
              <div style={{ marginTop: '1rem' }}>
                <strong>매칭된 그룹:</strong>
                <p style={{ color: '#e91e63', fontWeight: 'bold' }}>
                  {groupInfo.currentMatch.name} ({groupInfo.currentMatch.university})
                </p>
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Link to="/group" className="btn btn-primary">
                그룹 관리
              </Link>
              {matchingStatus?.canStartMatching && (
                <Link to="/matching" className="btn btn-success">
                  과팅 찾기
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p>아직 그룹에 속해있지 않습니다.</p>
            <Link to="/group" className="btn btn-primary">
              그룹 만들기
            </Link>
          </div>
        )}
      </div>

      {/* 매칭 상태 카드 */}
      {matchingStatus && (
        <div className="card">
          <h3>매칭 상태</h3>
          <div className="alert alert-info">
            {matchingStatus.statusMessage}
          </div>
          
          {matchingStatus.hasGroup && matchingStatus.group?.status === 'matched' && (
            <div>
              <p style={{ color: '#e91e63', fontWeight: 'bold' }}>
                🎉 매칭이 성사되었습니다!
              </p>
              <p>이제 1대1 통화를 통해 실제 과팅 진행 여부를 결정할 수 있습니다.</p>
              <Link to="/matching" className="btn btn-primary">
                매칭 관리하기
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 안내 카드 */}
      <div className="card">
        <h3>📋 이용 안내</h3>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>먼저 3명으로 구성된 그룹을 만드세요</li>
          <li>그룹 멤버들과 함께 과팅 가능한 시간대를 설정하세요</li>
          <li>매칭 찾기를 통해 조건에 맞는 상대방 그룹을 찾으세요</li>
          <li>매칭이 성사되면 1대1 통화로 최종 확인을 진행하세요</li>
          <li>양측 모두 동의하면 과팅이 확정됩니다!</li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;