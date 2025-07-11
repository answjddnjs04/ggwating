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
    
    // 에러 초기화
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword, university, department, gender, age, phone } = formData;

    if (!username.trim()) {
      setError('사용자명을 입력해주세요.');
      return false;
    }

    if (username.length < 2 || username.length > 20) {
      setError('사용자명은 2-20글자 사이여야 합니다.');
      return false;
    }

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return false;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6글자 이상이어야 합니다.');
      return false;
    }

    // 영문과 숫자 포함 검사 추가
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      setError('비밀번호는 영문과 숫자를 모두 포함해야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (!university.trim()) {
      setError('대학교를 입력해주세요.');
      return false;
    }

    if (!department.trim()) {
      setError('학과를 입력해주세요.');
      return false;
    }

    if (!gender) {
      setError('성별을 선택해주세요.');
      return false;
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum)) {
      setError('나이를 입력해주세요.');
      return false;
    }

    if (ageNum < 18 || ageNum > 30) {
      setError('나이는 18세 이상 30세 이하여야 합니다.');
      return false;
    }

    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 회원가입 폼 제출 시작');
    
    if (!validateForm()) {
      console.log('❌ 폼 유효성 검사 실패:', error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...submitData } = formData;
      
      console.log('� 제출할 데이터:', {
        ...submitData,
        password: '[보안상 숨김]',
        age: parseInt(submitData.age)
      });
      
      await register({
        ...submitData,
        age: parseInt(submitData.age)
      });
      
      console.log('✅ 회원가입 성공!');
      alert('🎉 회원가입이 완료되었습니다!');
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('❌ 회원가입 실패:', err);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">사용자명 *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="사용자명을 입력하세요 (2-20글자)"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일 *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호 *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요 (영문+숫자 포함, 최소 6글자)"
            required
            disabled={loading}
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            * 영문자와 숫자를 모두 포함해야 합니다 (예: abc123, hello1)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인 *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="university">대학교 *</label>
          <input
            type="text"
            id="university"
            name="university"
            value={formData.university}
            onChange={handleChange}
            placeholder="대학교명을 입력하세요 (예: 이화여자대학교)"
            required
            disabled={loading}
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            * 추후 재학증명서로 인증할 예정입니다
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="department">학과 *</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="학과명을 입력하세요 (예: 컴퓨터공학과)"
            required
            disabled={loading}
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            * 추후 재학증명서로 인증할 예정입니다
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="gender">성별 *</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">성별을 선택하세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="age">나이 *</label>
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
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">전화번호 *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ 
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '회원가입 처리 중...' : '🎉 회원가입'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
      </p>
    </div>
  );
};

export default Register;