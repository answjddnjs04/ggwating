import axios from 'axios';

// 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  console.log('🌐 현재 환경:', { hostname, port, protocol, href: window.location.href });
  
  // GitHub Codespaces 환경 감지
  if (hostname.includes('github.dev') || hostname.includes('.app.github.dev')) {
    // GitHub Codespaces의 경우 포트 5000으로 변경
    const baseUrl = `${protocol}//${hostname.replace('-3000', '-5000')}/api`;
    console.log('🚀 GitHub Codespaces 감지! API URL:', baseUrl);
    return baseUrl;
  }
  
  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // 기타 배포 환경 (Vercel, Netlify 등)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃 추가
});

// 요청 인터셉터 - 토큰 자동 추가 및 로깅
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 API 요청:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('🚨 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 로깅
api.interceptors.response.use(
  (response) => {
    console.log('📥 API 응답 성공:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('🚨 API 에러 상세:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown',
      responseData: error.response?.data
    });
    
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