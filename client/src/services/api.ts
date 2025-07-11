import axios from 'axios';

// 환경에 따른 API URL 설정 - 간단하고 안전한 버전
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const href = window.location.href;
  
  console.log('🌐 현재 환경 상세:', { 
    hostname, 
    protocol, 
    href,
    isGitHubCodespaces: hostname.includes('.app.github.dev'),
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1'
  });
  
  // GitHub Codespaces 환경 감지 - 안전한 URL 생성
  if (hostname.includes('.app.github.dev')) {
    // 포트 3000을 3001로 변경하되, 이중 슬래시 방지
    const serverHostname = hostname.replace('-3000', '-3001');
    const baseUrl = `${protocol}//${serverHostname}/api`;
    console.log('🚀 GitHub Codespaces 감지!');
    console.log('🔗 서버 호스트명:', serverHostname);
    console.log('🔗 최종 API URL:', baseUrl);
    return baseUrl;
  }
  
  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const baseUrl = 'http://localhost:3001/api';
    console.log('🔧 로컬 환경 감지! API URL:', baseUrl);
    return baseUrl;
  }
  
  // 기타 배포 환경
  console.log('🚀 배포 환경 감지! API URL: /api');
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 최종 설정된 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 API 요청:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`
    });
    
    return config;
  },
  (error) => {
    console.error('🚨 요청 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log('📥 API 응답 성공:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('🚨 API 에러:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`
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