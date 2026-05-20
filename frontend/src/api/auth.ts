import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/auth";

const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data: { username: string; email: string; password: string }) =>
  axios.post(`${BASE_URL}/register/`, data);

export const loginUser = (data: { username: string; password: string }) =>
  axios.post(`${BASE_URL}/login/`, data);

export const getCurrentUser = () =>
  api.get(`/me/`);