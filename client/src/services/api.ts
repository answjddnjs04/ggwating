import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
  getMe: () => api.get('/auth/me'),
};

// 그룹 API
export const groupAPI = {
  create: (groupData: any) => api.post('/groups/create', groupData),
  invite: (username: string) => api.post('/groups/invite', { username }),
  getMyGroup: () => api.get('/groups/my-group'),
  leave: () => api.post('/groups/leave'),
  setTimeSlots: (timeSlots: any[]) => api.post('/groups/time-slots', { timeSlots }),
};

// 매칭 API
export const matchingAPI = {
  findMatch: () => api.post('/matching/find-match'),
  getStatus: () => api.get('/matching/status'),
  cancel: () => api.post('/matching/cancel'),
  getAvailableGroups: () => api.get('/matching/available-groups'),
};

export default api;