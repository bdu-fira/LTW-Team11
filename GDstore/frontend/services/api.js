import axios from 'axios';

const getBaseURL = () => {
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 10000
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.log('Lỗi 401, cần đăng nhập');
    }
    return Promise.reject(error);
  }
);

export default API;