import axios from 'axios';

const API = axios.create({
  // This looks at your .env file. If it's missing, it defaults to localhost
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// This automatically attaches the token to EVERY request so you don't repeat yourself
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;