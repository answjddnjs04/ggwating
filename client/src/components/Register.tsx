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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  // 대학교 목록
  const universities = [
    '서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교',
    '중앙대학교', '경희대학교', '한국외국어대학교', '서강대학교', '이화여자대학교',
    '홍익대학교', '건국대학교', '동국대학교', '국민대학교', '숭실대학교',
    '세종대학교', '광운대학교', '명지대학교', '가천대학교', '인하대학교'
  ];

  // 학과 목록
  const departments = [
    '컴퓨터공학과', '전자공학과', '기계공학과', '산업공학과', '화학공학과',
    '건축학과', '토목공학과', '경영학과', '경제학과', '회계학과',
    '국어국문학과', '영어영문학과', '중어중문학과', '일어일문학과', '불어불문학과',
    '수학과', '물리학과', '화학과', '생물학과', '심리학과',
    '법학과', '정치외교학과', '사회학과', '신문방송학과', '광고홍보학과',
    '의학과', '간호학과', '약학과', '치의학과', '수의학과',
    '미술학과', '음악학과', '체육학과', '무용학과', '연극영화학과'
  ];

  // 실시간 유효성 검사
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'username':
        if (!value) {
          newErrors.username = '사용자명을 입력해주세요';
        } else if (value.length < 2) {
          newErrors.username = '사용자명은 2글자 이상이어야 합니다';
        } else if (value.length > 20) {
          newErrors.username = '사용자명은 20글자 이하여야 합니다';
        } else if (!/^[가-힣a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = '한글, 영문, 숫자, 언더스코어만 사용 가능합니다';
        } else {
          delete newErrors.username;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors.email = '이메일을 입력해주세요';
        } else if (!emailRegex.test(value)) {
          newErrors.email = '올바른 이메일 형식이 아닙니다';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = '비밀번호를 입력해주세요';
        } else if (value.length < 6) {
          newErrors.password = '비밀번호는 6글자 이상이어야 합니다';
        } else if (value.length > 50) {
          newErrors.password = '비밀번호는 50글자 이하여야 합니다';
        } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
          newErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다';
        } else {
          delete newErrors.password;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      case 'university':
        if (!value) {
          newErrors.university = '대학교를 선택해주세요';
        } else {
          delete newErrors.university;
        }
        break;

      case 'department':
        if (!value) {
          newErrors.department = '학과를 선택해주세요';
        } else {
          delete newErrors.department;
        }
        break;

      case 'gender':
        if (!value) {
          newErrors.gender = '성별을 선택해주세요';
        } else {
          delete newErrors.gender;
        }
        break;

      case 'age':
        const ageNum = parseInt(value);
        if (!value) {
          newErrors.age = '나이를 입력해주세요';
        } else if (isNaN(ageNum)) {
          newErrors.age = '나이는 숫자로 입력해주세요';
        } else if (ageNum < 18) {
          newErrors.age = '18세 이상만 가입 가능합니다';
        } else if (ageNum > 30) {
          newErrors.age = '30세 이하만 가입 가능합니다';
        } else {
          delete newErrors.age;
        }
        break;

      case 'phone':
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!value) {
          newErrors.phone = '전화번호를 입력해주세요';
        } else if (!phoneRegex.test(value)) {
          newErrors.phone = '010-0000-0000 형식으로 입력해주세요';
        } else {
          delete newErrors.phone;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 전화번호 자동 하이픈 추가
    if (name === 'phone') {
      const phoneNumber = value.replace(/[^0-9]/g, '');
      let formattedPhone = phoneNumber;
      
      if (phoneNumber.length >= 3) {
        formattedPhone = phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3);
      }
      if (phoneNumber.length >= 7) {
        formattedPhone = phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3, 7) + '-' + phoneNumber.slice(7, 11);
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
      validateField(name, formattedPhone);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }

    // 비밀번호 확인 재검사
    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 모든 필드 검사
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key as keyof typeof formData]);
    });

    // 에러가 있으면 제출 중단
    if (Object.keys(errors).length > 0) {
      alert('입력 정보를 다시 확인해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      const { confirmPassword, ...submitData } = formData;
      
      await register(submitData);
      alert('회원가입이 완료되었습니다! 🎉');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('회원가입 에러:', error);
      
      if (error.message) {
        alert(`회원가입 실패: ${error.message}`);
      } else {
        alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors";
    return errors[fieldName] ? `${baseClass} border-red-500` : `${baseClass} border-gray-300`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            💕 회원가입
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            대학생 과팅 매칭 서비스에 오신 것을 환영합니다!
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          {/* 회원가입 조건 안내 */}
          <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <h4 className="font-semibold text-pink-800 mb-2">📋 회원가입 조건</h4>
            <ul className="text-sm text-pink-700 space-y-1">
              <li>• 사용자명: 2-20글자 (한글, 영문, 숫자, _ 가능)</li>
              <li>• 비밀번호: 6글자 이상, 영문+숫자 포함</li>
              <li>• 나이: 18-30세</li>
              <li>• 전화번호: 010-0000-0000 형식</li>
              <li>• 대학교, 학과, 성별 필수 선택</li>
            </ul>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* 사용자명 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                사용자명 *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={getInputClassName('username')}
                placeholder="2-20글자, 한글/영문/숫자/_"
                maxLength={20}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={getInputClassName('email')}
                placeholder="example@university.ac.kr"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={getInputClassName('password')}
                placeholder="6글자 이상, 영문+숫자 포함"
                maxLength={50}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={getInputClassName('confirmPassword')}
                placeholder="비밀번호를 다시 입력해주세요"
                maxLength={50}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 대학교 */}
            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
                대학교 *
              </label>
              <select
                id="university"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className={getInputClassName('university')}
              >
                <option value="">대학교를 선택해주세요</option>
                {universities.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
              {errors.university && (
                <p className="mt-1 text-sm text-red-600">{errors.university}</p>
              )}
            </div>

            {/* 학과 */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                학과 *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={getInputClassName('department')}
              >
                <option value="">학과를 선택해주세요</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="mr-2 text-pink-600"
                  />
                  남성
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="mr-2 text-pink-600"
                  />
                  여성
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* 나이 */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                나이 *
              </label>
              <input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className={getInputClassName('age')}
                placeholder="18-30세"
                min="18"
                max="30"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 *
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className={getInputClassName('phone')}
                placeholder="010-0000-0000"
                maxLength={13}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? '회원가입 중...' : '🎉 회원가입'}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-pink-600 hover:text-pink-500">
                  로그인하기
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;