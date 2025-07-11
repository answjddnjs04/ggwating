import axios from 'axios';

// 환경에 따른 API URL 설정
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const href = window.location.href;
  
  console.log('🌐 현재 환경 상세:', { 
    hostname, 
    port, 
    protocol, 
    href,
    isGitHubCodespaces: hostname.includes('.app.github.dev'),
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1'
  });
  
  // GitHub Codespaces 환경 감지 (더 정확한 방법)
  if (hostname.includes('.app.github.dev')) {
    // GitHub Codespaces의 경우 포트 3001로 변경
    const serverUrl = href.replace('-3000.app.github.dev', '-3001.app.github.dev').split('/ggwating')[0];
    const baseUrl = `${serverUrl}/api`;
    console.log('🚀 GitHub Codespaces 감지! 서버 URL:', serverUrl);
    console.log('🔗 최종 API URL:', baseUrl);
    return baseUrl;
  }
  
  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔧 로컬 환경 감지! API URL: http://localhost:3001/api');
    return 'http://localhost:3001/api';
  }
  
  // 기타 배포 환경 (Vercel, Netlify, GitHub Pages 등)
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
  timeout: 15000, // 15초 타임아웃 (GitHub Codespaces는 느릴 수 있음)
});

// 요청 인터셉터 - 토큰 자동 추가 및 상세 로깅
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 API 요청 상세:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? '[토큰 포함됨]' : '[토큰 없음]'
      }
    });
    
    return config;
  },
  (error) => {
    console.error('🚨 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 상세 로깅
api.interceptors.response.use(
  (response) => {
    console.log('📥 API 응답 성공:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      fullUrl: `${response.config.baseURL}${response.config.url}`,
      dataType: typeof response.data,
      dataSize: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    console.error('🚨 API 에러 매우 상세:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown',
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      requestData: error.config?.data
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