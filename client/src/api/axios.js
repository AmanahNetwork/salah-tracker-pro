import axios from 'axios';

const API = axios.create({
  // Use your actual backend URL here
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000', 
});

// Add your token logic if you're using it
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

export default API;