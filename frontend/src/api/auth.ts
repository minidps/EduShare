// 1. Коригиран импорт (с малка буква)
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/auth";

// Създаване на инстанс
const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor за автоматично добавяне на токен
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Използване на 'api' вместо 'axios' и съкращаване на пътищата
export const registerUser = (data: { username: string; email: string; password: string; grade: string }) =>
  api.post("/register/", data);

export const loginUser = (data: { username: string; password: string }) =>
  api.post("/login/", data);

export const getCurrentUser = () =>
  api.get("/me/");

export const submitVote = (data: { post_id: string; value: 'up' | 'down' | 'none' }) =>
  api.post("/vote/", data);