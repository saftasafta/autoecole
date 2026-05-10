import axios from 'axios';

const api = axios.create({
  baseURL: 'https://autoecole-backend.onrender.com',
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
