import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchingAPI } from '../services/api';

interface MatchingStatus {
  hasGroup: boolean;
  group?: {
    _id: string;
    name: string;
    members: Array<{
      _id: string;
      username: string;
      email: string;
    }>;
    status: string;
    currentMatch?: {
      _id: string;
      name: string;
      university: string;
      members: Array<{
        _id: string;
        username: string;
      }>;
    };
  };
  statusMessage: string;
  canStartMatching: boolean;
}

const MatchingPage: React.FC = () => {
  const { user } = useAuth();
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statusResponse = await matchingAPI.getStatus();
      setMatchingStatus(statusResponse.data);
    } catch (error: any) {
      setError('데이터 로딩에 실패했습니다.');
      console.error('매칭 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatch = async () => {
    setSearching(true);
    setError('');
    setSuccess('');

    try {
      const response = await matchingAPI.findMatch();
      
      if (response.data.matchedGroup) {
        setSuccess('🎉 매칭이 성사되었습니다! 상대방 그룹과 매칭되었어요.');
        fetchData(); // 데이터 새로고침
      } else {
        setError('현재 매칭 가능한 그룹이 없습니다. 나중에 다시 시도해주세요.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '매칭 찾기에 실패했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleCancelMatch = async () => {
    if (!window.confirm('정말로 매칭을 취소하시겠습니까?')) {
      return;
    }

    try {
      await matchingAPI.cancel();
      setSuccess('매칭이 취소되었습니다.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || '매칭 취소에 실패했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#28a745';
      case 'matching': return '#ffc107';
      case 'matched': return '#e91e63';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!matchingStatus?.hasGroup) {
    return (
      <div className="card">
        <h2>과팅 찾기</h2>
        <div className="alert alert-info">
          먼저 그룹을 만들고 멤버를 모은 후에 매칭을 시작할 수 있습니다.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>과팅 찾기</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* 현재 상태 */}
      <div className="card">
        <h3>현재 상태</h3>
        <div className="alert alert-info">
          {matchingStatus.statusMessage}
        </div>
        
        {matchingStatus.group && (
          <div>
            <p><strong>내 그룹:</strong> {matchingStatus.group.name}</p>
            <p>
              <strong>상태:</strong> 
              <span style={{ 
                color: getStatusColor(matchingStatus.group.status),
                fontWeight: 'bold',
                marginLeft: '0.5rem'
              }}>
                {matchingStatus.group.status}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* 매칭 액션 */}
      {matchingStatus.group?.status === 'ready' && matchingStatus.canStartMatching && (
        <div className="card">
          <h3>매칭 시작하기</h3>
          <p>그룹이 준비되었습니다! 매칭을 시작해보세요.</p>

          <button 
            onClick={handleFindMatch}
            className="btn btn-success"
            disabled={searching}
          >
            {searching ? '매칭 찾는 중...' : '과팅 찾기 시작!'}
          </button>
        </div>
      )}

      {/* 매칭된 상태 */}
      {matchingStatus.group?.status === 'matched' && matchingStatus.group.currentMatch && (
        <div className="card">
          <h3>🎉 매칭 성사!</h3>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <p><strong>매칭된 그룹:</strong> {matchingStatus.group.currentMatch.name}</p>
            <p><strong>대학교:</strong> {matchingStatus.group.currentMatch.university}</p>
            <div>
              <strong>상대방 멤버:</strong>
              <div className="group-members">
                {(matchingStatus.group.currentMatch.members || []).map((member) => (
                  <div key={member._id} className="member-item">
                    <span>{member.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="alert alert-info">
            <h4>다음 단계:</h4>
            <ol style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
              <li>각 그룹에서 대표 1명씩 1대1 통화를 진행합니다</li>
              <li>통화에서 실제 과팅 진행 여부를 결정합니다</li>
              <li>양측 모두 동의하면 과팅이 확정됩니다</li>
              <li>만남 장소와 시간을 조율합니다</li>
            </ol>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#e91e63', fontWeight: 'bold' }}>
              💬 곧 1대1 통화 기능이 활성화됩니다!
            </p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              현재는 매칭만 가능하며, 통화 기능은 추후 업데이트 예정입니다.
            </p>
          </div>

          <button 
            onClick={handleCancelMatch}
            className="btn btn-danger"
            style={{ marginTop: '1rem' }}
          >
            매칭 취소
          </button>
        </div>
      )}

      {/* 매칭이 불가능한 경우 */}
      {!matchingStatus.canStartMatching && matchingStatus.group?.status !== 'matched' && (
        <div className="card">
          <h3>매칭 준비 미완료</h3>
          <div className="alert alert-info">
            매칭을 시작하려면 다음 조건들이 필요합니다:
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>그룹 멤버 3명 모두 모집 완료</li>
              <li>과팅 가능한 시간대 설정 완료</li>
              <li>그룹 상태가 '준비 완료' 상태</li>
            </ul>
          </div>
          <p>
            <a href="/group" style={{ color: '#e91e63' }}>
              그룹 관리 페이지
            </a>에서 설정을 완료해주세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchingPage;