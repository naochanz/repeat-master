import axios from 'axios';

const isDevelopment = __DEV__;
const LOCAL_IP = '100.64.1.37';

const API_URL = isDevelopment 
  ? `http://${LOCAL_IP}:3000`
  : 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// トークンをセット
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 認証API
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};