import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8001",
  timeout: 120000 // 120 second timeout for LLM parsing
});

// Adding interceptors for auth tokens if needed in future
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) req.headers.set('Authorization', `Bearer ${token}`);
  return req;
});

// Handle 401 Unauthorized errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all auth-related local storage
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('ai_placement_user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
