import axios from 'axios';

// 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  // 개발 환경에서는 localhost 사용
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // 배포 환경에서는 같은 도메인의 /api 사용 (서버가 static 파일도 서빙하므로)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/verify'),
};

// 그룹 API
export const groupAPI = {
  create: (groupData: any) => api.post('/groups/create', groupData),
  invite: (username: string) => api.post('/groups/invite', { username }),
  getMyGroup: () => api.get('/groups/my-group'),
  leave: () => api.post('/groups/leave'),
  setTimeSlots: (timeSlots: any[]) => api.post('/groups/timeslots', { timeSlots }),
};

// 매칭 API
export const matchingAPI = {
  findMatch: () => api.post('/matching/start'),
  getStatus: () => api.get('/matching/status'),
  cancel: () => api.post('/matching/cancel'),
};

export default api;