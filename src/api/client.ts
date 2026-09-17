import axios from 'axios';
import Constants from 'expo-constants';

// Auto-detect PC IP address from Expo bundler hostUri when running on physical phone
const debuggerHost = Constants.expoConfig?.hostUri;
const localhostIp = debuggerHost ? debuggerHost.split(':')[0] : '192.168.8.138';

export const API_BASE_URL = `http://${localhostIp}:5000/api`;
console.log('📱 Mobile App connecting to Backend API at:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let userToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  userToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => userToken;
