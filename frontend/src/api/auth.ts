import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/auth";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data: { username: string; email: string; password: string; grade: string }) =>
  api.post("/register/", data);

export const loginUser = (data: { username: string; password: string }) =>
  api.post("/login/", data);

export const getCurrentUser = () =>
  api.get("/me/");

export const submitVote = (data: { post_id: string; value: 'up' | 'down' | 'none' }) =>
  api.post("/vote/", data);

export const getPosts = () => {
  return api.get('/posts/');
};

export const createPost = (data: any) => {
  return api.post('/posts/create/', data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
};