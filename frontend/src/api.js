import axios from 'axios';

const api = axios.create({
  // Use environment variable from Vercel/Render, otherwise use the cloud API link
  baseURL: import.meta.env.VITE_API_URL || 'https://autoecole-api.onrender.com',
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
