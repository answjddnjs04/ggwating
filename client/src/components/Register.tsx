import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    department: '',
    gender: '',
    age: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 에러 메시지 초기화
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, email, password, confirmPassword, university, department, gender, age, phone } = formData;

    // 기본 유효성 검사
    if (!username || !email || !password || !confirmPassword || !university || !department || !gender || !age || !phone) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    const ageNum = parseInt(age);
    if (ageNum < 18 || ageNum > 30) {
      setError('나이는 18세 이상 30세 이하여야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...submitData } = formData;
      
      console.log('🚀 회원가입 시도:', {
        ...submitData,
        password: '[HIDDEN]',
        age: ageNum
      });
      
      await register({
        ...submitData,
        age: ageNum
      });
      
      alert('회원가입이 완료되었습니다! 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('🚨 회원가입 상세 에러:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
        stack: err.stack
      });
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
        setError('🔌 서버에 연결할 수 없습니다. 인터넷 연결을 확인하거나 나중에 다시 시도해주세요.');
      } else if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError(`💥 회원가입 중 오류가 발생했습니다: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>💕 회원가입</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        대학생 과팅 매칭 서비스에 오신 것을 환영합니다!
      </p>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">사용자명</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="사용자명을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요 (최소 6자리)"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="university">대학교</label>
          <input
            type="text"
            id="university"
            name="university"
            value={formData.university}
            onChange={handleChange}
            placeholder="대학교명을 입력하세요 (예: 이화여자대학교)"
            required
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            * 추후 재학증명서로 인증할 예정입니다
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="department">학과</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="학과명을 입력하세요 (예: 컴퓨터공학과)"
            required
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            * 추후 재학증명서로 인증할 예정입니다
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="gender">성별</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">성별을 선택하세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="age">나이</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="나이를 입력하세요 (18-30)"
            min="18"
            max="30"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">전화번호</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading ? '가입 중...' : '🎉 회원가입'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
      </p>
    </div>
  );
};

export default Register;