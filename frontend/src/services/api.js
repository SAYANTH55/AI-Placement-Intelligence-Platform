import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000"
});

// Adding interceptors for auth tokens if needed in future
API.interceptors.request.use((req) => {
  // const token = localStorage.getItem('token');
  // if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
