import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <header className="header">
      <h1>💕 대학생 과팅 매칭</h1>
      
      {user ? (
        <nav className="header-nav">
          <Link to="/dashboard" className={isActive('/dashboard')}>
            대시보드
          </Link>
          <Link to="/group" className={isActive('/group')}>
            그룹 관리
          </Link>
          <Link to="/matching" className={isActive('/matching')}>
            과팅 찾기
          </Link>
          <div className="user-info">
            <span>안녕하세요, {user.username}님!</span>
            <button onClick={handleLogout} className="logout-btn">
              로그아웃
            </button>
          </div>
        </nav>
      ) : (
        <nav className="header-nav">
          <Link to="/login" className={isActive('/login')}>
            로그인
          </Link>
          <Link to="/register" className={isActive('/register')}>
            회원가입
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;